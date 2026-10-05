/* =========================================================
   ResultScene : リザルト表示 + ハイスコア保存
   ========================================================= */
class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.result = {
      score: (data && data.score) || 0,
      miss: (data && data.miss) || 0
    };
  }

  create() {
    const W = GAME.WIDTH;

    /* ---- 記録の保存（ハイスコア更新なら true） ---- */
    this.isNewRecord = ScoreStore.submit(this.result);
    const best = ScoreStore.load();

    UI.background(this);

    UI.text(this, W / 2, 84, 'RESULT', 58, '#ffffff', { strokeThickness: 0 })
      .setStroke('#16305c', 10);

    /* ---- 称号 ---- */
    const rank = GAME.rankOf(this.result.score, this.result.miss);
    this.special = !!rank.special;
    this.rankBadge(W / 2, 174, rank);
    if (this.special) {
      /* 称号のスタンプが押された直後に、特別演出 */
      this.playLoveEvent(ResultScene.LOVE_START);
    }

    /* ---- メインパネル ---- */
    UI.panel(this, W / 2, 420, 470, 396, { radius: 28, alpha: 0.93 });

    UI.text(this, W / 2, 282, 'つかまえた回数', 24, '#4a6699', { strokeThickness: 0 });

    const scoreText = UI.text(this, W / 2, 350, '0', 92, '#ff4f8b', { strokeThickness: 0 });
    scoreText.setStroke('#ffffff', 8);
    scoreText.setShadow(0, 5, 'rgba(22,48,92,0.25)', 6, false, true);
    UI.countUp(this, scoreText, this.result.score, 900, '', 260);

    /* 区切り線 */
    const line = this.add.graphics();
    line.lineStyle(3, 0x16305c, 0.14);
    line.beginPath();
    line.moveTo(W / 2 - 180, 424);
    line.lineTo(W / 2 + 180, 424);
    line.strokePath();

    /* ---- 内訳 ---- */
    const tries = this.result.score + this.result.miss;
    const rate = tries > 0 ? Math.round(this.result.score / tries * 100) : 0;
    this.row(478, GAME.COLOR.heart, 'つかまえた', this.result.score, '回', '#c2245e',
      '成功率 ' + rate + '%');
    this.row(556, GAME.COLOR.lost, 'のがした', this.result.miss, '回', '#54708a',
      '空振り・時間切れ');

    /* ---- ハイスコア ---- */
    UI.panel(this, W / 2, 688, 470, 96, { radius: 22, alpha: 0.86 });
    UI.text(this, W / 2 - 200, 688, 'HI-SCORE', 22, '#4a6699', { originX: 0, strokeThickness: 0 });

    if (best) {
      UI.text(this, W / 2 + 200, 682, best.score + ' 回', 44, '#16305c', { originX: 1, strokeThickness: 0 });
      UI.text(this, W / 2 + 200, 716, 'のがした ' + best.miss + ' 回', 18, '#4a6699',
        { originX: 1, strokeThickness: 0 });
    }

    if (this.isNewRecord) {
      this.newRecordBadge(W / 2, 612);
    }

    /* ---- ボタン ---- */
    UI.button(this, W / 2, 810, 320, 76, 'もう一度あそぶ', () => this.goto('Game'), { fontSize: 30 });
    UI.button(this, W / 2, 900, 260, 64, 'タイトルへ', () => this.goto('Title'), {
      fontSize: 26,
      color: 0x6f8cc4,
      shade: 0x4d6a9f
    });

    this.input.keyboard.on('keydown-SPACE', () => this.goto('Game'));
    this.input.keyboard.on('keydown-ENTER', () => this.goto('Game'));
    this.input.keyboard.on('keydown-ESC', () => this.goto('Title'));

    this.leaving = false;
    this.cameras.main.fadeIn(320, 255, 255, 255);
  }

  /* 内訳の1行 */
  row(y, iconColor, label, count, unit, color, detail) {
    const W = GAME.WIDTH;

    UI.heartIcon(this, W / 2 - 170, y, 44, iconColor);
    UI.text(this, W / 2 - 132, y, label, 24, '#16305c', { originX: 0, strokeThickness: 0 });
    UI.text(this, W / 2 + 176, y - 8, count + ' ' + unit, 30, color, { originX: 1, strokeThickness: 0 });
    UI.text(this, W / 2 + 176, y + 20, detail, 18, '#4a6699', { originX: 1, strokeThickness: 0 });
  }

  /* 称号バッジ（スコアのカウントアップが終わってから出す） */
  rankBadge(x, y, rank) {
    const w = 400;
    const h = 74;
    const chipW = 92;
    const isGood = GAME.isGoodRank(rank);

    const badge = this.add.container(x, y).setDepth(110);

    const g = this.add.graphics();
    g.fillStyle(0x16305c, 0.18);
    g.fillRoundedRect(-w / 2, -h / 2 + 7, w, h, h / 2);
    g.fillStyle(rank.shade, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, h / 2);
    g.fillStyle(rank.color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.fillStyle(0xffffff, 0.22);
    g.fillRoundedRect(-w / 2 + 10, -h / 2 + 8, w - 20, h * 0.32, h * 0.2);
    g.lineStyle(4, 0xffffff, 0.95);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    /* 左側の「称号」チップ */
    const chip = this.add.graphics();
    chip.fillStyle(0xffffff, 0.9);
    chip.fillRoundedRect(-w / 2 + 12, -24, chipW, 48, 24);

    const chipText = this.add.text(-w / 2 + 12 + chipW / 2, 0, '称号', {
      fontFamily: FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#16305c'
    }).setOrigin(0.5);

    const nameText = this.add.text((-w / 2 + 12 + chipW + w / 2) / 2 + 6, 0, rank.label, {
      fontFamily: FONT,
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    nameText.setStroke(Phaser.Display.Color.IntegerToColor(rank.shade).rgba, 6);
    nameText.setShadow(0, 3, 'rgba(0,0,0,0.3)', 4, false, true);

    badge.add([g, chip, chipText, nameText]);
    this.rankBadgeObj = badge;
    badge.setScale(1.9);
    badge.setAlpha(0);
    badge.setAngle(-8);

    /* スタンプを押すように出す */
    this.tweens.add({
      targets: badge,
      scale: 1,
      angle: -3,
      alpha: 1,
      duration: 420,
      delay: 1150,
      ease: 'Back.out',
      onComplete: () => {
        Sfx.rank(isGood);
        this.cameras.main.shake(160, 0.006);
        this.tweens.add({
          targets: badge,
          angle: { from: -3, to: 2 },
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });
  }

  newRecordBadge(x, y) {
    /* 特別演出があるときは、その後に出す */
    const delay = this.special ? ResultScene.LOVE_END : 1900;
    const badge = this.add.container(x, y);

    const g = this.add.graphics();
    g.fillStyle(0xff4f6d, 1);
    g.fillRoundedRect(-125, -24, 250, 48, 24);
    g.lineStyle(4, 0xffffff, 1);
    g.strokeRoundedRect(-125, -24, 250, 48, 24);

    const t = this.add.text(0, 0, 'NEW RECORD !', {
      fontFamily: FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    badge.add([g, t]);
    badge.setAngle(-6);
    badge.setScale(0);
    badge.setDepth(120);

    this.tweens.add({
      targets: badge,
      scale: 1,
      duration: 420,
      delay: delay,
      ease: 'Back.out',
      onComplete: () => {
        Sfx.finish();
        this.tweens.add({
          targets: badge,
          angle: { from: -6, to: 4 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });

    /* お祝いの紙吹雪 */
    this.time.delayedCall(delay, () => {
      const emitter = this.add.particles(GAME.WIDTH / 2, -20, 'spark', {
        x: { min: 0, max: GAME.WIDTH },
        speedY: { min: 120, max: 300 },
        speedX: { min: -60, max: 60 },
        scale: { start: 0.8, end: 0.2 },
        lifespan: 3200,
        frequency: 90,
        tint: [0xe23b2e, 0xffd66b, 0x35c46a, 0x63b4ff],
        quantity: 2
      }).setDepth(-10);
      this.time.delayedCall(2600, () => emitter.stop());
    });
  }

  /*
    =======================================================
    「両想い」の特別演出（config の RANKS で special: true の称号）
    1. 画面がピンクになり、左右から飛んできたハートが真ん中でくっつく
    2. 大きなハートの中に宵ちゃん。「両想い！」の文字、ハートの花火とハートの雨、特別なファンファーレ
    3. 少しすると消えて、称号バッジのまわりにハートがふわふわ浮かび続ける
    ・画面をタップすると途中で飛ばせる
    =======================================================
  */
  playLoveEvent(delay) {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;
    const cx = W / 2;
    const cy = H / 2;
    const tints = [0xff4f8b, 0xff9ec2, 0xffffff, 0xffd66b];

    this.time.delayedCall(delay, () => {
      if (this.leaving) { return; }

      let merged = false;
      let closed = false;
      const parts = [];
      const add = (obj) => { parts.push(obj); return obj.setDepth(300 + parts.length); };

      /* ピンクの幕（下のボタンを押せないようにして、タップで演出を飛ばす） */
      const shade = add(this.add.rectangle(0, 0, W, H, 0xff7fb0, 1).setOrigin(0).setAlpha(0));
      shade.setInteractive();
      this.tweens.add({ targets: shade, alpha: 0.72, duration: 300 });

      /* 左右から飛んでくる2つのハート */
      const smallScale = 130 / GAME.HEART_TEX.inner;
      const left = add(this.add.image(-90, cy, 'heart').setScale(smallScale).setAngle(-30));
      const right = add(this.add.image(W + 90, cy, 'heart').setScale(smallScale).setAngle(30));
      Sfx.heart();

      let rain = null;

      const close = () => {
        if (closed) { return; }
        closed = true;
        if (rain) { rain.stop(); }
        parts.forEach((obj) => {
          if (!obj.active) { return; }
          this.tweens.killTweensOf(obj);
          this.tweens.add({ targets: obj, alpha: 0, duration: 380, onComplete: () => obj.destroy() });
        });
        this.loveAura();
      };

      const merge = () => {
        if (merged || closed) { return; }
        merged = true;
        left.destroy();
        right.destroy();

        this.cameras.main.flash(280, 255, 255, 255);
        this.cameras.main.shake(200, 0.006);
        Sfx.love();

        /* 大きなハート（白っぽい中身 → 宵ちゃん → 縁のハート の順に重ねる） */
        const fill = add(UI.heartIcon(this, cx, cy, 304, 0xffffff));
        const chara = add(this.add.image(cx, cy + 6, GAME.CHARA.id));
        UI.fitWidth(chara, 170);
        const frame = add(this.add.image(cx, cy, 'heart'));
        frame.setScale(330 / GAME.HEART_TEX.inner);

        [fill, chara, frame].forEach((obj, i) => {
          const s = obj.scale;
          obj.setScale(0);
          this.tweens.add({
            targets: obj,
            scale: s,
            duration: 460,
            delay: i === 1 ? 160 : 0,
            ease: 'Back.out',
            onComplete: () => {
              /* ドキドキと脈打つ（宵ちゃんはゆらゆら） */
              if (i === 1) {
                this.tweens.add({ targets: obj, angle: { from: -6, to: 6 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
              } else {
                this.tweens.add({ targets: obj, scale: s * 1.06, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
              }
            }
          });
        });

        /* 文字 */
        const title = add(UI.text(this, cx, cy - 222, '両想い！', 84, '#ffffff', { strokeThickness: 0 }));
        title.setStroke('#ff4f8b', 14);
        title.setScale(0);
        this.tweens.add({ targets: title, scale: 1, duration: 420, delay: 120, ease: 'Back.out' });
        this.tweens.add({ targets: title, angle: { from: -4, to: 4 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

        const sub = add(UI.text(this, cx, cy + 215, 'ミスなしで ' + this.result.score + ' 回つかまえた！', 30, '#c2245e', { strokeThickness: 7 }));
        sub.setAlpha(0);
        this.tweens.add({ targets: sub, alpha: 1, y: cy + 200, duration: 360, delay: 380 });

        /* ハートの花火 */
        const burst = add(this.add.particles(cx, cy, 'heart_small', {
          speed: { min: 220, max: 560 },
          angle: { min: 0, max: 360 },
          rotate: { min: -40, max: 40 },
          scale: { start: 0.75, end: 0 },
          lifespan: 1100,
          quantity: 44,
          tint: tints,
          emitting: false
        }));
        burst.explode();

        /* ハートの雨 */
        rain = add(this.add.particles(0, -30, 'heart_small', {
          x: { min: 0, max: W },
          speedY: { min: 150, max: 330 },
          speedX: { min: -50, max: 50 },
          rotate: { min: -40, max: 40 },
          scale: { min: 0.3, max: 0.7 },
          lifespan: 4200,
          frequency: 55,
          quantity: 1,
          tint: tints
        }));

        this.time.delayedCall(ResultScene.LOVE_HOLD, close);
      };

      this.tweens.add({ targets: left, x: cx - 34, angle: 0, duration: ResultScene.LOVE_FLY, ease: 'Cubic.in' });
      this.tweens.add({ targets: right, x: cx + 34, angle: 0, duration: ResultScene.LOVE_FLY, ease: 'Cubic.in', onComplete: merge });

      shade.on('pointerdown', close);
    });
  }

  /* 特別演出のあと、称号バッジのまわりにハートが浮かび続ける */
  loveAura() {
    const b = this.rankBadgeObj;
    if (!b || !b.active) { return; }
    this.add.particles(b.x, b.y + 20, 'heart_small', {
      x: { min: -190, max: 190 },
      speedY: { min: -90, max: -40 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.38, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 1500,
      frequency: 160,
      tint: [0xff4f8b, 0xff9ec2, 0xffffff]
    }).setDepth(105);
  }

  goto(sceneKey) {
    if (this.leaving) { return; }
    this.leaving = true;

    this.cameras.main.fadeOut(260, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }
}

/*
  「両想い」の特別演出のタイミング（ms）
    LOVE_START : リザルトが出てから演出が始まるまで（称号のスタンプの直後）
    LOVE_FLY   : 左右のハートが真ん中でくっつくまで
    LOVE_HOLD  : くっついてから、演出が消え始めるまで
    LOVE_END   : 演出が終わるころ（NEW RECORD はこのあとに出す）
*/
ResultScene.LOVE_START = 1650;
ResultScene.LOVE_FLY = 650;
ResultScene.LOVE_HOLD = 3000;
ResultScene.LOVE_END = ResultScene.LOVE_START + ResultScene.LOVE_FLY + ResultScene.LOVE_HOLD + 200;
