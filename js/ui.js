/* =========================================================
   各シーンで共通して使う見た目のパーツ
   ========================================================= */
const UI = {

  /* ---- 空・雲・地面の背景 ---- */
  background: function (scene, withGround) {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;
    const C = GAME.COLOR;

    const sky = scene.add.graphics().setDepth(-100);
    sky.fillGradientStyle(C.skyTop, C.skyTop, C.skyBottom, C.skyBottom, 1);
    sky.fillRect(0, 0, W, H);

    /* ゆっくり流れる雲 */
    const clouds = [];
    for (let i = 0; i < 5; i++) {
      const y = 90 + i * 150 + Phaser.Math.Between(-24, 24);
      const scale = Phaser.Math.FloatBetween(0.55, 1.15);
      const cloud = scene.add.image(-200, y, 'cloud')
        .setScale(scale)
        .setAlpha(0.55)
        .setDepth(-90);
      const duration = Phaser.Math.Between(26000, 46000);
      scene.tweens.add({
        targets: cloud,
        x: { from: -160, to: W + 160 },
        duration: duration,
        repeat: -1,
        delay: Phaser.Math.Between(0, 7000)
      });
      clouds.push(cloud);
    }

    if (withGround !== false) {
      const gy = H - GAME.GROUND_H;
      const ground = scene.add.graphics().setDepth(-80);
      ground.fillStyle(C.groundDark, 1);
      ground.fillRect(0, gy, W, GAME.GROUND_H);
      ground.fillStyle(C.ground, 1);
      ground.fillRect(0, gy, W, GAME.GROUND_H - 14);
      ground.lineStyle(4, 0x3f9a4a, 0.5);
      ground.beginPath();
      ground.moveTo(0, gy + 2);
      ground.lineTo(W, gy + 2);
      ground.strokePath();
    }

    return clouds;
  },

  /* ---- 元画像の比率を保ったまま高さを指定する ---- */
  fitHeight: function (obj, height) {
    const src = { width: obj.frame.realWidth, height: obj.frame.realHeight };   /* 切り出したフレームにも対応 */
    obj.setDisplaySize(height * (src.width / src.height), height);
    return obj;
  },

  /* ---- 元画像の比率を保ったまま幅を指定する ---- */
  fitWidth: function (obj, width) {
    const src = { width: obj.frame.realWidth, height: obj.frame.realHeight };   /* 切り出したフレームにも対応 */
    obj.setDisplaySize(width, width * (src.height / src.width));
    return obj;
  },

  /* ---- 元画像の比率を保ったまま、枠（maxW × maxH）に収まる最大サイズにする ---- */
  fitContain: function (obj, maxW, maxH) {
    const src = { width: obj.frame.realWidth, height: obj.frame.realHeight };   /* 切り出したフレームにも対応 */
    const scale = Math.min(maxW / src.width, maxH / src.height);
    obj.setDisplaySize(src.width * scale, src.height * scale);
    return obj;
  },

  /*
    ---- ハート形の輪郭の点（中心 cx, cy・幅 width） ----
    テクスチャの描画と「ハートの中にいるか」の判定の両方でこの形を使うので、見た目と判定が一致する。
    （x = 16sin³t, y = 13cost - 5cos2t - 2cos3t - cos4t のハート曲線。幅32 × 高さ29 を幅 width に拡大）
  */
  heartPoints: function (cx, cy, width, steps) {
    const n = steps || 72;
    const s = width / 32;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      /* 上下の幅（-17 〜 12）の真ん中が中心に来るよう 2.5 ずらす */
      pts.push({ x: cx + x * s, y: cy - (y + 2.5) * s });
    }
    return pts;
  },

  /* ---- 小さなハートのアイコン（色は tint で指定） ---- */
  heartIcon: function (scene, x, y, width, color) {
    return UI.fitWidth(scene.add.image(x, y, 'heart_small'), width).setTint(color);
  },

  /* ---- 見出し・本文テキスト ---- */
  text: function (scene, x, y, value, size, color, opts) {
    const o = opts || {};
    const t = scene.add.text(x, y, value, {
      fontFamily: FONT,
      fontSize: size + 'px',
      fontStyle: o.bold === false ? 'normal' : 'bold',
      color: color || '#16305c',
      align: o.align || 'center',
      stroke: o.stroke || '#ffffff',
      strokeThickness: o.strokeThickness === undefined ? 5 : o.strokeThickness,
      lineSpacing: o.lineSpacing || 6
    });
    t.setOrigin(o.originX === undefined ? 0.5 : o.originX, o.originY === undefined ? 0.5 : o.originY);
    if (o.shadow !== false) {
      t.setShadow(0, 4, 'rgba(22, 48, 92, 0.28)', 6, false, true);
    }
    return t;
  },

  /* ---- 白い角丸パネル ---- */
  panel: function (scene, x, y, w, h, opts) {
    const o = opts || {};
    const g = scene.add.graphics();
    const r = o.radius === undefined ? 26 : o.radius;

    g.fillStyle(0x16305c, 0.16);
    g.fillRoundedRect(x - w / 2, y - h / 2 + 7, w, h, r);
    g.fillStyle(o.fill === undefined ? GAME.COLOR.panel : o.fill, o.alpha === undefined ? 0.9 : o.alpha);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    g.lineStyle(3, 0xffffff, 0.9);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    return g;
  },

  /* ---- ボタン ---- */
  button: function (scene, x, y, w, h, label, onClick, opts) {
    const o = opts || {};
    const base = o.color === undefined ? 0xffb020 : o.color;
    const shade = o.shade === undefined ? 0xd88300 : o.shade;
    const r = h / 2;
    const DEPTH = 6;   /* 下側の厚み（影の部分）も押せるようにする */
    const PAD = 6;     /* 見た目より少し広く反応させる（指で押しやすくする） */

    /* 外側：位置と当たり判定を持つ。タイトルの脈動tweenなど外からの演出はこちらにかかる */
    const container = scene.add.container(x, y);
    /* 内側：押下・ホバーの見た目だけを動かす（外側のtweenとスケールを取り合わない） */
    const face = scene.add.container(0, 0);
    const g = scene.add.graphics();

    g.fillStyle(shade, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + DEPTH, w, h, r);
    g.fillStyle(base, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.fillStyle(0xffffff, 0.28);
    g.fillRoundedRect(-w / 2 + 10, -h / 2 + 7, w - 20, h * 0.34, r * 0.6);
    g.lineStyle(3, 0xffffff, 0.85);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    const t = scene.add.text(0, 0, label, {
      fontFamily: FONT,
      fontSize: (o.fontSize || 30) + 'px',
      fontStyle: 'bold',
      color: o.textColor || '#ffffff'
    }).setOrigin(0.5);
    t.setShadow(0, 3, 'rgba(0,0,0,0.28)', 4, false, true);

    face.add([g, t]);
    container.add(face);

    UI.pressable(scene, container, face, w, h, onClick, { pad: PAD, extraBottom: DEPTH });

    return container;
  },

  /*
    ---- 押せる部品の共通処理（ボタン・キャラ選択カードで使う） ----
    container : 位置と当たり判定を持つ外側
    face      : 押下・ホバーで拡大縮小させる内側（container の子）
    w, h      : 見た目の大きさ（中心基準で描いている前提）
    opts.pad         : 見た目より広く反応させる余白
    opts.extraBottom : 下側だけ追加で反応させる幅（ボタンの厚み部分など）
    opts.sound       : false にすると押したときの効果音を鳴らさない（呼び出し側で鳴らす場合）
  */
  pressable: function (scene, container, face, w, h, onClick, opts) {
    const o = opts || {};
    const PAD = o.pad === undefined ? 6 : o.pad;
    const extraBottom = o.extraBottom || 0;

    /*
      当たり判定
      Container は displayOrigin が（幅/2, 高さ/2）なので、ヒット領域は「左上 = (0, 0)」基準で指定する。
      中心基準（-w/2, -h/2）で指定すると、実際に反応するのがボタンの左上 1/4 だけになってしまう。
    */
    container.setSize(w, h);
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-PAD, -PAD, w + PAD * 2, h + extraBottom + PAD * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });

    /* この部品の上で押し始めたか（別の場所で押して、ここで離しただけでは反応させない） */
    let pressed = false;

    const animateFace = function (scale, duration, ease) {
      scene.tweens.killTweensOf(face);
      scene.tweens.add({ targets: face, scale: scale, duration: duration, ease: ease || 'Quad.out' });
    };

    container.on('pointerover', function (pointer) {
      /* タッチでは hover が押した瞬間に来て拡大→縮小がちらつくので、マウスのときだけ */
      if (pointer.wasTouch || pressed) { return; }
      animateFace(1.05, 120);
    });

    container.on('pointerout', function () {
      pressed = false;
      animateFace(1, 120);
    });

    container.on('pointerdown', function () {
      pressed = true;
      /* 押した瞬間に見た目を変える（tween待ちにしない） */
      scene.tweens.killTweensOf(face);
      face.setScale(0.93);
    });

    container.on('pointerup', function (pointer) {
      if (!pressed) { return; }
      pressed = false;
      animateFace(pointer.wasTouch ? 1 : 1.05, 160, 'Back.out');
      if (o.sound !== false) { Sfx.ui(); }
      onClick();
    });

    /* ボタンの外で指を離したときも押下状態を解除する（ボタン側の pointerup の後に呼ばれる） */
    const releaseOutside = function () {
      if (!pressed) { return; }
      pressed = false;
      animateFace(1, 120);
    };
    scene.input.on('pointerup', releaseOutside);
    scene.events.once('shutdown', function () {
      scene.input.off('pointerup', releaseOutside);
    });

    return container;
  },

  /* ---- 数値がカウントアップするテキスト ---- */
  countUp: function (scene, textObject, to, duration, prefix, delay) {
    const state = { v: 0 };
    scene.tweens.add({
      targets: state,
      v: to,
      duration: duration,
      delay: delay || 0,
      ease: 'Cubic.out',
      onUpdate: function () {
        textObject.setText((prefix || '') + Math.round(state.v));
      },
      onComplete: function () {
        textObject.setText((prefix || '') + to);
      }
    });
  }
};
