/* =========================================================
   GameScene : 本編（制限時間は GAME.DURATION 秒）
   ・キャラが画面の中を動き回る
   ・画面を押すとハートが出て、指についてくる
   ・指を離した瞬間にキャラがハートの中にいれば「つかまえた」
   ・ハートは押してから 3秒で消える（それまでに離さないと時間切れ）
   ・GAME.PHASE_SECONDS 秒ごとにキャラが速くなる
   ========================================================= */
class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    /* ---- 状態 ---- */
    this.catchCount = 0;
    this.missCount = 0;
    this.timeLeft = GAME.DURATION;
    this.phase = -1;
    this.running = false;
    this.finished = false;
    /* 今出ているハート（1つだけ。出ていなければ null） */
    this.heart = null;
    /* シーンは再利用されるので、前回のデバッグ描画用オブジェクト（破棄済み）を持ち越さない */
    this.debugGfx = null;

    /* ハートの判定範囲（中心 0,0 の形。判定するときに相対座標で調べる） */
    this.heartShape = new Phaser.Geom.Polygon(UI.heartPoints(0, 0, GAME.HEART.SIZE, 96));

    UI.background(this);

    this.createTarget();
    this.buildHud();
    this.setupInput();

    /* ---- カウントダウン後に開始 ---- */
    this.cameras.main.fadeIn(300, 255, 255, 255);
    this.readyGo();
  }

  /* =======================================================
     つかまえるキャラ
     ======================================================= */
  createTarget() {
    const chara = GAME.CHARA;
    const F = GAME.FIELD;

    /*
      target : 位置と、つかまえた・現れたときの演出の大きさ
      sizer  : 0.9〜1.1倍の大きさの変動（CHARA_SCALE）
      img    : ぴょこぴょこ跳ねる
    */
    const target = this.add.container(GAME.WIDTH / 2, (F.top + F.bottom) / 2).setDepth(20);
    const sizer = this.add.container(0, 0);
    const img = this.add.image(0, 0, chara.id);
    UI.fitWidth(img, chara.width);
    const shadow = this.add.ellipse(0, img.displayHeight / 2 - 6, chara.width * 0.62, chara.width * 0.12, 0x16305c, 0.18);
    sizer.add([shadow, img]);
    target.add(sizer);

    this.target = target;
    this.targetSizer = sizer;
    this.targetImg = img;

    /* 判定の中心（core の中心）が、画像の中心からどれだけずれているか（表示上のpx） */
    const c = chara.core;
    this.coreOffset = {
      x: (c.x + c.w / 2 - img.width / 2) * img.scaleX,
      y: (c.y + c.h / 2 - img.height / 2) * img.scaleY
    };

    /* 画像が画面からはみ出さない範囲（container の中心の動ける範囲。一番大きいときで計算） */
    const maxScale = GAME.CHARA_SCALE.SCALE_MAX;
    const halfW = img.displayWidth * maxScale / 2;
    const halfH = img.displayHeight * maxScale / 2;
    this.bounds = {
      left: halfW,
      right: GAME.WIDTH - halfW,
      top: F.top + halfH,
      bottom: F.bottom - halfH
    };

    /* active: 動いていて、つかまえられる状態か */
    this.move = { active: false, vx: 0, vy: 0, turnLeft: 0, dashLeft: 0 };

    this.tweens.add({
      targets: img,
      y: -10,
      duration: 240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.out'
    });

    this.wobbleSize();
  }

  /* 大きさを SCALE_MIN 〜 SCALE_MAX の間で、なめらかに変え続ける */
  wobbleSize() {
    const S = GAME.CHARA_SCALE;
    this.tweens.add({
      targets: this.targetSizer,
      scale: Phaser.Math.FloatBetween(S.SCALE_MIN, S.SCALE_MAX),
      duration: Phaser.Math.Between(S.SCALE_TIME_MIN, S.SCALE_TIME_MAX),
      ease: 'Sine.inOut',
      onComplete: () => this.wobbleSize()
    });
  }

  /* 判定の中心（ワールド座標） */
  targetCore() {
    const scale = this.target.scaleX * this.targetSizer.scaleX;
    /* 左右反転しているときは、判定の中心も左右反転する */
    const flip = this.targetImg.flipX ? -1 : 1;
    return {
      x: this.target.x + this.coreOffset.x * flip * scale,
      y: this.target.y + this.coreOffset.y * scale
    };
  }

  /* 新しい向き・速さを決める */
  pickDirection() {
    const p = GAME.PHASES[this.phase];
    const m = this.move;
    const angle = Math.random() * Math.PI * 2;
    const speed = Phaser.Math.FloatBetween(p.speedMin, p.speedMax);

    m.vx = Math.cos(angle) * speed;
    m.vy = Math.sin(angle) * speed;
    m.turnLeft = Phaser.Math.Between(p.turnMin, p.turnMax);
    m.dashLeft = (Math.random() < p.dashRate) ? GAME.DASH_TIME : 0;
  }

  moveTarget(delta) {
    const m = this.move;
    if (!this.running || !m.active) { return; }

    m.turnLeft -= delta;
    if (m.turnLeft <= 0) { this.pickDirection(); }

    let rate = 1;
    if (m.dashLeft > 0) {
      m.dashLeft -= delta;
      rate = GAME.DASH_SCALE;
    }

    const b = this.bounds;
    const dt = delta / 1000;
    let x = this.target.x + m.vx * rate * dt;
    let y = this.target.y + m.vy * rate * dt;

    /* 画面の端で跳ね返る */
    if (x < b.left) { x = b.left; m.vx = Math.abs(m.vx); }
    if (x > b.right) { x = b.right; m.vx = -Math.abs(m.vx); }
    if (y < b.top) { y = b.top; m.vy = Math.abs(m.vy); }
    if (y > b.bottom) { y = b.bottom; m.vy = -Math.abs(m.vy); }

    this.target.setPosition(x, y);
    /* 進む方向に少し傾ける */
    this.target.angle = Phaser.Math.Linear(this.target.angle, Phaser.Math.Clamp(m.vx * rate / 30, -10, 10), 0.2);

    /*
      進む方向を向く（元の画像の向きは GAME.CHARA.facing）
      ほぼ真上・真下に進んでいるときは、向きがパタパタ変わらないよう今の向きのままにする
    */
    if (Math.abs(m.vx) > 25) {
      const imageFacing = GAME.CHARA.facing === 'left' ? -1 : 1;
      this.targetImg.setFlipX(Math.sign(m.vx) !== imageFacing);
    }
  }

  /* つかまえたキャラを、ハートから離れた場所に出し直す */
  respawnTarget(awayX, awayY) {
    const b = this.bounds;
    let x = 0;
    let y = 0;
    for (let i = 0; i < 20; i++) {
      x = Phaser.Math.Between(b.left, b.right);
      y = Phaser.Math.Between(b.top, b.bottom);
      if (Phaser.Math.Distance.Between(x, y, awayX, awayY) > 260) { break; }
    }

    const t = this.target;
    this.tweens.killTweensOf(t);
    t.setPosition(x, y).setScale(0).setAlpha(1).setAngle(0);
    this.sparkle(x, y, [0xffffff, 0xffd66b], 8);
    Sfx.appear();

    this.tweens.add({
      targets: t,
      scale: 1,
      duration: 260,
      ease: 'Back.out',
      onComplete: () => {
        if (!this.running) { return; }
        this.move.active = true;
        this.pickDirection();
      }
    });
  }

  /* =======================================================
     入力（ハート）
     ======================================================= */
  setupInput() {
    const onDown = (pointer) => this.spawnHeart(pointer);
    const onUp = (pointer) => this.releaseHeart(pointer);

    this.input.on('pointerdown', onDown);
    this.input.on('pointerup', onUp);
    /* 画面の外で指を離したとき */
    this.input.on('pointerupoutside', onUp);

    this.events.once('shutdown', () => {
      this.input.off('pointerdown', onDown);
      this.input.off('pointerup', onUp);
      this.input.off('pointerupoutside', onUp);
    });
  }

  heartPosition(pointer) {
    return { x: pointer.worldX, y: pointer.worldY + GAME.HEART.OFFSET_Y };
  }

  spawnHeart(pointer) {
    /* ハートは1つずつ（別の指で押しても増えない） */
    if (!this.running || this.heart) { return; }

    const pos = this.heartPosition(pointer);
    const baseScale = GAME.HEART.SIZE / GAME.HEART_TEX.inner;
    const img = this.add.image(pos.x, pos.y, 'heart').setDepth(60).setScale(baseScale * 0.4);
    this.tweens.add({ targets: img, scale: baseScale, duration: 140, ease: 'Back.out' });

    this.heart = {
      pointer: pointer,
      x: pos.x,
      y: pos.y,
      elapsed: 0,
      warned: 0,
      baseScale: baseScale,
      img: img,
      gauge: this.add.graphics().setDepth(61)
    };

    Sfx.heart();
  }

  /* 指を離した：その瞬間にキャラがハートの中にいるか */
  releaseHeart(pointer) {
    const h = this.heart;
    if (!h || pointer.id !== h.pointer.id) { return; }
    this.heart = null;

    const pos = this.heartPosition(pointer);
    h.x = pos.x;
    h.y = pos.y;
    h.img.setPosition(h.x, h.y);
    h.gauge.destroy();

    if (this.move.active && this.isInHeart(h.x, h.y)) {
      this.onCatch(h);
    } else {
      this.onWhiff(h);
    }
  }

  isInHeart(hx, hy) {
    const core = this.targetCore();
    return Phaser.Geom.Polygon.Contains(this.heartShape, core.x - hx, core.y - hy);
  }

  /* 毎フレーム：指についていく・残り時間・時間切れ */
  updateHeart(delta) {
    const h = this.heart;
    if (!h) { return; }

    /* 離したイベントを取りこぼしたとき（ウィンドウ外など）の保険 */
    if (!h.pointer.isDown) {
      this.releaseHeart(h.pointer);
      return;
    }

    const pos = this.heartPosition(h.pointer);
    h.x = pos.x;
    h.y = pos.y;
    h.img.setPosition(h.x, h.y);

    h.elapsed += delta;
    const remain = GAME.HEART.LIFE - h.elapsed;
    if (remain <= 0) {
      this.heart = null;
      h.gauge.destroy();
      this.onTimeout(h);
      return;
    }

    /* 残りわずかで点滅＋カチカチ音 */
    const warning = remain < GAME.HEART.WARN;
    if (warning) {
      h.img.setAlpha(0.55 + 0.45 * Math.abs(Math.cos(h.elapsed / 80)));
      const step = Math.floor(h.elapsed / 250);
      if (step !== h.warned) {
        h.warned = step;
        Sfx.warn();
      }
    } else {
      h.img.setAlpha(1);
    }

    this.drawHeartGauge(h, remain / GAME.HEART.LIFE, warning);
  }

  /* ハートの上の残り時間バー */
  drawHeartGauge(h, rate, warning) {
    const w = GAME.HEART.SIZE * 0.56;
    const barH = 10;
    const x = h.x - w / 2;
    const y = h.y - GAME.HEART.SIZE * 0.453 - 26;
    const g = h.gauge;

    g.clear();
    g.fillStyle(0x16305c, 0.35);
    g.fillRoundedRect(x - 3, y - 3, w + 6, barH + 6, (barH + 6) / 2);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(x, y, w, barH, barH / 2);
    g.fillStyle(warning ? GAME.COLOR.heartWarn : GAME.COLOR.heart, 1);
    g.fillRoundedRect(x, y, Math.max(barH, w * rate), barH, barH / 2);
  }

  /* =======================================================
     つかまえた / のがした
     ======================================================= */
  onCatch(h) {
    this.catchCount++;
    this.scoreText.setText(String(this.catchCount));
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.3, to: 1 },
      duration: 240,
      ease: 'Back.out'
    });

    /* キャラがハートに吸い込まれる */
    this.move.active = false;
    const t = this.target;
    this.tweens.killTweensOf(t);
    this.tweens.add({
      targets: t,
      x: h.x,
      y: h.y,
      scale: 0.2,
      alpha: 0,
      angle: 0,
      duration: 260,
      ease: 'Back.in'
    });

    /* ハートがドキッと大きくなってから消える */
    const img = h.img;
    this.tweens.killTweensOf(img);
    img.setAlpha(1).setScale(h.baseScale);
    this.tweens.add({
      targets: img,
      scale: h.baseScale * 1.25,
      duration: 150,
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => {
        this.tweens.add({
          targets: img,
          scale: h.baseScale * 1.5,
          alpha: 0,
          duration: 220,
          onComplete: () => img.destroy()
        });
      }
    });

    this.popup(h.x, h.y - 30, '+1', '#ff4f8b', 52);
    this.time.delayedCall(180, () => this.sparkle(h.x, h.y, [0xff4f8b, 0xff9ec2, 0xffffff, 0xffd66b], 16));
    this.cameras.main.flash(120, 255, 210, 230);
    Sfx.catch();

    this.time.delayedCall(GAME.RESPAWN_DELAY, () => this.respawnTarget(h.x, h.y));
  }

  /* 離したけど、ハートの中にいなかった */
  onWhiff(h) {
    this.addMiss();
    this.fadeHeart(h.img, h.baseScale);
    this.popup(h.x, h.y - 20, 'おしい！', '#7b8ca3', 34);
    Sfx.whiff();
  }

  /* 3秒たって消えた */
  onTimeout(h) {
    this.addMiss();

    const img = h.img;
    this.tweens.killTweensOf(img);
    img.setAlpha(1).setTint(GAME.COLOR.lost);
    this.tweens.add({
      targets: img,
      x: { from: h.x - 8, to: h.x + 8 },
      duration: 40,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.tweens.add({
          targets: img,
          y: img.y + 60,
          angle: 20,
          alpha: 0,
          duration: 380,
          ease: 'Quad.in',
          onComplete: () => img.destroy()
        });
      }
    });

    this.popup(h.x, h.y - 20, '時間切れ…', '#7b8ca3', 34);
    Sfx.lost();
  }

  addMiss() {
    this.missCount++;
    this.missText.setText(String(this.missCount));
  }

  fadeHeart(img, baseScale) {
    this.tweens.killTweensOf(img);
    this.tweens.add({
      targets: img,
      scale: baseScale * 0.5,
      alpha: 0,
      duration: 220,
      ease: 'Quad.in',
      onComplete: () => img.destroy()
    });
  }

  popup(x, y, label, color, size) {
    x = Phaser.Math.Clamp(x, 80, GAME.WIDTH - 80);

    const t = UI.text(this, x, y, label, size, color, { strokeThickness: 0 })
      .setDepth(150);
    t.setStroke('#ffffff', 7);

    this.tweens.add({
      targets: t,
      y: y - 90,
      alpha: 0,
      scale: { from: 1.25, to: 0.9 },
      duration: 720,
      ease: 'Quad.out',
      onComplete: () => t.destroy()
    });
  }

  /* 小さなハートが飛び散る */
  sparkle(x, y, tints, quantity) {
    const emitter = this.add.particles(x, y, 'heart_small', {
      speed: { min: 120, max: 300 },
      angle: { min: 0, max: 360 },
      rotate: { min: -30, max: 30 },
      scale: { start: 0.45, end: 0 },
      lifespan: 520,
      quantity: quantity,
      tint: tints,
      emitting: false
    }).setDepth(140);

    emitter.explode();
    this.time.delayedCall(800, () => emitter.destroy());
  }

  /* =======================================================
     HUD
     ======================================================= */
  buildHud() {
    const W = GAME.WIDTH;

    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x16305c, 0.12);
    bar.fillRoundedRect(14, 20, W - 28, 96, 20);
    bar.fillStyle(0xffffff, 1);
    bar.fillRoundedRect(14, 14, W - 28, 96, 20);

    UI.text(this, 40, 40, 'CATCH', 18, '#4a6699', { originX: 0, strokeThickness: 0, shadow: false }).setDepth(101);
    this.scoreText = UI.text(this, 40, 76, '0', 42, '#ff4f8b', { originX: 0, strokeThickness: 0, shadow: false }).setDepth(101);

    UI.text(this, W - 40, 40, 'TIME', 18, '#4a6699', { originX: 1, strokeThickness: 0, shadow: false }).setDepth(101);
    this.timeText = UI.text(this, W - 40, 76, String(GAME.DURATION), 42, '#16305c', { originX: 1, strokeThickness: 0, shadow: false }).setDepth(101);

    /* のがした回数（灰色のハート + 回数） */
    UI.text(this, W / 2, 40, 'MISS', 18, '#4a6699', { strokeThickness: 0, shadow: false }).setDepth(101);
    UI.heartIcon(this, W / 2 - 20, 76, 30, GAME.COLOR.lost).setDepth(101);
    this.missText = UI.text(this, W / 2 + 2, 78, '0', 30, '#54708a', { originX: 0, strokeThickness: 0, shadow: false }).setDepth(101);

    /* 残り時間ゲージ */
    this.gaugeW = W - 28;
    this.gaugeBg = this.add.graphics().setDepth(100);
    this.gaugeBg.fillStyle(0x16305c, 0.18);
    this.gaugeBg.fillRoundedRect(14, 116, this.gaugeW, 14, 7);
    this.gauge = this.add.graphics().setDepth(101);
    this.drawGauge(1);
  }

  drawGauge(rate) {
    const r = Phaser.Math.Clamp(rate, 0, 1);
    this.gauge.clear();
    this.gauge.fillStyle(r > 0.25 ? 0x35c46a : 0xff4f6d, 1);
    if (r > 0) {
      this.gauge.fillRoundedRect(14, 116, Math.max(14, this.gaugeW * r), 14, 7);
    }
  }

  /* =======================================================
     開始演出
     ======================================================= */
  readyGo() {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;
    const words = ['3', '2', '1', 'START!'];
    let i = 0;
    let current = null;

    const show = () => {
      /* 直前の表示は必ず消してから次を出す */
      if (current) { current.destroy(); current = null; }

      const isLast = (i === words.length - 1);
      const t = UI.text(this, W / 2, H / 2 - 60, words[i], isLast ? 84 : 120, '#ffffff', { strokeThickness: 0 })
        .setDepth(200);
      t.setStroke('#16305c', 12);
      t.setScale(0.4);
      current = t;

      this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.out' });
      this.time.delayedCall(340, () => {
        if (!t.active) { return; }
        this.tweens.add({
          targets: t,
          alpha: 0,
          scale: 1.35,
          duration: 240,
          onComplete: () => {
            if (current === t) { current = null; }
            t.destroy();
          }
        });
      });

      if (isLast) { Sfx.start(); } else { Sfx.count(); }

      i++;
      if (i < words.length) {
        this.time.delayedCall(600, show);
      } else {
        this.time.delayedCall(420, () => this.startRound());
      }
    };

    show();
  }

  /* =======================================================
     ラウンド進行
     ======================================================= */
  startRound() {
    this.running = true;

    /* 1秒ごとのカウントダウン */
    this.tickTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.onSecond,
      callbackScope: this
    });

    this.applyPhase(0, true);
    this.move.active = true;
    this.pickDirection();
  }

  onSecond() {
    if (!this.running) { return; }

    this.timeLeft--;
    this.timeText.setText(String(Math.max(0, this.timeLeft)));
    this.drawGauge(this.timeLeft / GAME.DURATION);

    if (this.timeLeft <= 10 && this.timeLeft > 0) {
      this.timeText.setColor('#ff2f55');
      this.tweens.add({
        targets: this.timeText,
        scale: { from: 1.25, to: 1 },
        duration: 260,
        ease: 'Quad.out'
      });
      Sfx.count();
    }

    if (this.timeLeft <= 0) {
      this.endRound();
      return;
    }

    /* PHASE_SECONDS 秒ごとに難易度アップ */
    const elapsed = GAME.DURATION - this.timeLeft;
    const next = GAME.phaseIndexOf(elapsed);
    if (next !== this.phase) {
      this.applyPhase(next, false);
    }
  }

  applyPhase(index, silent) {
    this.phase = index;
    /* 新しい速さをすぐ反映する */
    if (this.move.active) { this.pickDirection(); }
    if (!silent) { this.showSpeedUp(); }
  }

  showSpeedUp() {
    const t = UI.text(this, GAME.WIDTH / 2, 300, 'SPEED UP!', 62, '#ffffff', { strokeThickness: 0 })
      .setDepth(200)
      .setScale(0.5);
    t.setStroke('#ff4f6d', 12);

    this.tweens.add({ targets: t, scale: 1, duration: 240, ease: 'Back.out' });
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: 250,
      delay: 620,
      duration: 340,
      onComplete: () => t.destroy()
    });

    this.cameras.main.flash(180, 255, 220, 220);
    Sfx.tone(440, 880, 0.22, 'square', 0.12, 0);
  }

  /* =======================================================
     終了
     ======================================================= */
  endRound() {
    if (this.finished) { return; }
    this.finished = true;
    this.running = false;
    this.move.active = false;

    if (this.tickTimer) { this.tickTimer.remove(false); }

    this.timeText.setText('0');
    this.drawGauge(0);

    /* 押している途中のハートは数えずに消す */
    if (this.heart) {
      const h = this.heart;
      this.heart = null;
      h.gauge.destroy();
      this.fadeHeart(h.img, h.baseScale);
    }

    Sfx.finish();

    const t = UI.text(this, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, 'TIME UP!', 92, '#ffffff', { strokeThickness: 0 })
      .setDepth(200)
      .setScale(0.4);
    t.setStroke('#16305c', 14);

    this.tweens.add({ targets: t, scale: 1, duration: 380, ease: 'Back.out' });

    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(280, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Result', {
          score: this.catchCount,
          miss: this.missCount
        });
      });
    });
  }

  /* =======================================================
     デバッグ表示（config の DEBUG: true）
     ハートの判定範囲（マゼンタ）とキャラの判定点（赤）を描く
     ======================================================= */
  drawDebug() {
    if (!GAME.DEBUG) { return; }
    if (!this.debugGfx) {
      this.debugGfx = this.add.graphics().setDepth(1000);
    }
    const g = this.debugGfx;
    g.clear();

    const core = this.targetCore();
    g.fillStyle(0xff0000, 1);
    g.fillCircle(core.x, core.y, 5);

    if (this.heart) {
      const h = this.heart;
      g.lineStyle(2, 0xff00ff, 1);
      g.strokePoints(UI.heartPoints(h.x, h.y, GAME.HEART.SIZE, 96), true, true);
    }
  }

  /* =======================================================
     毎フレーム
     ======================================================= */
  update(time, delta) {
    this.moveTarget(delta);
    this.updateHeart(delta);
    this.drawDebug();
  }
}
