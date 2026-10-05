/* =========================================================
   TitleScene : タイトル / ハートから逃げる宵ちゃんの演出 / 遊び方 / ハイスコア表示
   ========================================================= */
/* =========================================================
   タイトルの追いかけっこ（ハートから逃げる宵ちゃん）のパターン
   ・1周（画面の端から端まで）ごとに、パターンと走る向きが変わる
   ・パターンはシャッフルした順に全部出てから、また並べ直す
   ・各パターンは次の3つを持つ
       track(c, s)         : コース上の距離 s の地点の Y 座標（ハートも同じコースを通る）
       init(c)             : その周の始めの準備
       update(scene, c, dt): 毎フレーム、宵ちゃんとハートの目標の速さ（targetR / targetH）を決める
   ・速さは px/秒。accR / accH が大きいほど、目標の速さにすばやく変わる（＝緩急が強い）
   ========================================================= */
const CHASE_PATTERNS = {

  /* ジグザグ：上下に大きく揺れながら、速くなったり遅くなったり */
  zigzag: {
    track: function (c, s) {
      return c.cy + 34 * Math.asin(Math.sin(s / 120 * Math.PI * 2)) * 2 / Math.PI;
    },
    init: function (c) {
      c.state = 'run';
    },
    update: function (scene, c) {
      c.targetR = 240 + 110 * Math.sin(c.t * 2.6);
      c.accR = 5;
      c.targetH = 232;
      c.accH = 3;
    }
  },

  /* ひとやすみ：立ち止まって汗をかいていると、ハートがそーっと近づく → 気づいて猛ダッシュ */
  rest: {
    track: function (c, s) {
      return c.cy + 14 * Math.sin(s / 60);
    },
    init: function (c) {
      c.state = 'run';
      c.sH = c.sR - 320;
    },
    update: function (scene, c, dt) {
      if (c.state === 'run') {
        c.targetR = 250;
        c.accR = 4;
        c.targetH = 200;
        if (c.sR >= c.margin + GAME.WIDTH * 0.64) {
          c.state = 'rest';
        }
      } else if (c.state === 'rest') {
        c.targetR = 0;
        c.accR = 3.5;
        c.targetH = 95;
        c.accH = 2;
        if (c.sR - c.sH < 185) {
          c.state = 'notice';
          c.timer = 0.42;
          c.vH = 0;
          scene.chaseMark('!');
        }
      } else if (c.state === 'notice') {
        c.targetR = 0;
        c.vR = 0;
        c.targetH = 0;
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = 'escape';
          c.vR = 540;
          c.jumpT = 0.36;
        }
      } else {
        c.targetR = 540;
        c.accR = 10;
        c.targetH = 360;
        c.accH = 2.5;
      }
    }
  },

  /* おいかけっこ：ハートがぐんぐん迫る → ギリギリでダッシュ、を何度もくり返す */
  sprint: {
    track: function (c, s) {
      return c.cy + 26 * Math.sin(s / 70);
    },
    init: function (c) {
      c.state = 'chase';
    },
    update: function (scene, c, dt) {
      if (c.state === 'chase') {
        c.targetR = 170;
        c.accR = 3;
        c.targetH = 330;
        c.accH = 2;
        if (c.sR - c.sH < 170) {
          c.state = 'dash';
          c.timer = 0.7;
          c.vR = 480;
          c.jumpT = 0.3;
          scene.chaseMark('!');
        }
      } else {
        c.targetR = 480;
        c.accR = 10;
        c.targetH = 150;
        c.accH = 3;
        c.timer -= dt;
        if (c.timer <= 0) { c.state = 'chase'; }
      }
    }
  },

  /* ぴょんぴょん：大きく跳ねて逃げる。着地のたびに一瞬止まる。ハートも同じように跳ねて追う */
  hop: {
    noBob: true,      /* コース自体が跳ねるので、小さな上下の揺れはしない */
    track: function (c, s) {
      return c.cy + 34 - 78 * Math.abs(Math.sin(Math.PI * s / 150));
    },
    init: function (c) {
      c.state = 'air';
      c.lastHop = Math.floor(c.sR / 150);
    },
    update: function (scene, c, dt) {
      c.targetH = 200;
      c.accH = 3;
      if (c.state === 'air') {
        c.targetR = 340;
        c.vR = 340;
        const hop = Math.floor(c.sR / 150);
        if (hop !== c.lastHop) {
          /* 着地 */
          c.lastHop = hop;
          c.state = 'land';
          c.timer = 0.17;
          c.vR = 0;
          scene.dustPuff(c.runner.x, c.runner.y + c.img.displayHeight / 2 - 12);
        }
      } else {
        c.targetR = 0;
        c.vR = 0;
        c.timer -= dt;
        if (c.timer <= 0) { c.state = 'air'; }
      }
    }
  },

  /* だるまさんがころんだ：歩きながら時々ふり返る。見られるとハートはピタッと止まる → 近すぎたら逃げる */
  daruma: {
    track: function (c, s) {
      return c.cy + 10 * Math.sin(s / 50);
    },
    init: function (c) {
      c.state = 'walk';
      c.timer = 1.2;
      c.looks = 0;
      c.sH = c.sR - 330;
    },
    update: function (scene, c, dt) {
      c.timer -= dt;
      if (c.state === 'walk') {
        c.facingBack = false;
        c.targetR = 140;
        c.accR = 4;
        c.targetH = 215;
        c.accH = 3;
        /* ふり返るのは、2人とも画面に見えているときだけ */
        const canLook = c.sR > c.margin + 70 && c.sR < c.margin + GAME.WIDTH - 140;
        const heartOnScreen = c.sH > c.margin - 30;
        /* ハートが近づきすぎたら（または3回ふり返ったら）逃げる */
        const tooClose = c.sR - c.sH < 175;
        if (heartOnScreen && (tooClose || (canLook && c.timer <= 0))) {
          if (tooClose || c.looks >= 3) {
            c.state = 'escape';
            c.vR = 520;
            c.jumpT = 0.36;
            scene.chaseMark('!');
          } else {
            c.state = 'look';
            c.timer = 0.9;
            c.looks++;
            c.facingBack = true;
            c.vR = 0;
            c.vH = 0;
            scene.chaseMark('?', '#3a7bd5');
          }
        }
      } else if (c.state === 'look') {
        /* ふり返っている間は、2人とも止まる（ハートはぷるぷる震える） */
        c.targetR = 0;
        c.vR = 0;
        c.targetH = 0;
        c.vH = 0;
        if (c.timer <= 0) {
          c.state = 'walk';
          c.timer = Phaser.Math.FloatBetween(0.9, 1.5);
          c.facingBack = false;
        }
      } else {
        c.targetR = 520;
        c.accR = 10;
        c.targetH = 340;
        c.accH = 2;
      }
    }
  }
};

class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;

    UI.background(this);

    /* ---- タイトルロゴ（assets/img/logo.png の透明な余白を除いた部分。BootScene で切り出し） ---- */
    const logo = this.add.container(W / 2, GAME.LOGO_Y);

    const logoImage = this.add.image(0, 0, 'logo', 'trim');
    UI.fitHeight(logoImage, GAME.LOGO_HEIGHT);
    /* ドキドキするように少しだけ脈打つ */
    this.tweens.add({
      targets: logoImage,
      scale: logoImage.scale * 1.03,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    logo.add(logoImage);

    this.tweens.add({
      targets: logo,
      y: GAME.LOGO_Y + 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    /* ---- ハートから逃げる宵ちゃん ---- */
    this.buildChaseDemo(405);

    /* ふわふわ浮かぶハートの飾り */
    this.demoHearts();

    /* ---- 遊び方 ---- */
    UI.panel(this, W / 2, 590, 470, 146, { radius: 22, alpha: 0.86 });
    const lines = [
      '画面を押すとハートが出る（' + Math.round(GAME.HEART.LIFE / 1000) + '秒で消える）',
      '宵ちゃんをハートで包んで離すとキャッチ！',
      GAME.DURATION + '秒で何回つかまえられるかな？'
    ];
    lines.forEach((line, i) => {
      const y = 548 + i * 42;
      UI.heartIcon(this, W / 2 - 200, y, 24, GAME.COLOR.heart);
      UI.text(this, W / 2 - 180, y, line, 20, i === 1 ? '#c2245e' : '#16305c', { originX: 0, strokeThickness: 0 });
    });

    UI.text(this, W / 2, 684, 'PCではマウスのボタンを押している間ハートが出ます', 18, '#4a6699', { strokeThickness: 3 });

    /* ---- ハイスコア ---- */
    this.drawHighScore(W / 2, 762);

    /* ---- スタートボタン ---- */
    const btn = UI.button(this, W / 2, 884, 320, 82, 'ゲームスタート', () => this.startGame(), { fontSize: 32 });
    this.tweens.add({
      targets: btn,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    /* ---- 入力 ---- */
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    this.starting = false;
    this.cameras.main.fadeIn(320, 255, 255, 255);
  }

  /*
    =======================================================
    タイトルの演出：ハートに追いかけられて、宵ちゃんが逃げ回る
    ・画面の端から端まで走ると1周。1周ごとにパターン（CHASE_PATTERNS）と向きが変わる
    ・2人とも「コース上の距離」（sR / sH）で動き、同じコースを通る
    ・どのパターンでも差は最低 gapMin px あるので、ハートが宵ちゃんに重なることはない
    =======================================================
  */
  buildChaseDemo(cy) {
    const chara = GAME.CHARA;

    /* 逃げる宵ちゃん（runner で位置と傾き、中の img で跳ねる・向きを変える） */
    const runner = this.add.container(0, cy).setDepth(2);
    const img = this.add.image(0, 0, chara.id);
    UI.fitWidth(img, chara.titleWidth);
    const shadow = this.add.ellipse(0, img.displayHeight / 2 - 8, chara.titleWidth * 0.6, chara.titleWidth * 0.12, 0x16305c, 0.18);
    runner.add([shadow, img]);

    /* 追いかけるハート（ゲーム中と同じ見た目） */
    const heartScale = 120 / GAME.HEART_TEX.inner;
    const heart = this.add.image(0, cy, 'heart').setDepth(1).setScale(heartScale);

    this.chase = {
      cy: cy,
      margin: 120,       /* 画面の外に出てから、次の周が始まるまでの余白 */
      gapMin: 150,       /* 宵ちゃんとハートの最低限の差（px） */
      runner: runner,
      img: img,
      heart: heart,
      heartScale: heartScale,
      t: 0,
      dir: 1,            /* 1: 左→右 / -1: 右→左 */
      order: [],
      pattern: null,
      state: '',
      timer: 0,
      sR: 0, vR: 0, targetR: 0, accR: 4,   /* 宵ちゃん：進んだ距離・速さ・目標の速さ・加速の強さ */
      sH: 0, vH: 0, targetH: 0, accH: 3,   /* ハート　：同じ */
      facingBack: false,
      jumpT: 0,
      bob: 0,
      beat: 0,
      puffLeft: 0,
      sweatLeft: 0
    };

    this.startChaseLap(true);
  }

  /* 次の周を始める（パターンを選び、向きを変える） */
  startChaseLap(first) {
    const c = this.chase;

    if (c.order.length === 0) {
      c.order = Phaser.Utils.Array.Shuffle(Object.keys(CHASE_PATTERNS));
      /* 並べ直したとき、同じパターンが続かないようにする */
      if (c.order[0] === c.pattern) { c.order.push(c.order.shift()); }
    }
    c.pattern = c.order.shift();
    if (!first) { c.dir = -c.dir; }

    /* 最初だけは、宵ちゃんが画面の中にいる状態から始める */
    c.sR = first ? c.margin + 150 : 0;
    c.sH = c.sR - 230;
    c.vR = c.targetR = 200;
    c.vH = c.targetH = 200;
    c.accR = 4;
    c.accH = 3;
    c.state = '';
    c.timer = 0;
    c.jumpT = 0;
    c.facingBack = false;

    CHASE_PATTERNS[c.pattern].init(c);
  }

  /* コース上の距離 → 画面のX座標（向きによって左右が逆になる） */
  chaseX(s) {
    const c = this.chase;
    return c.dir > 0 ? s - c.margin : GAME.WIDTH + c.margin - s;
  }

  updateChaseDemo(delta) {
    const c = this.chase;
    if (!c) { return; }
    const dt = Math.min(delta, 50) / 1000;

    /* 2人とも画面の外に出たら、次の周へ（描く前に切り替える） */
    if (c.sH > GAME.WIDTH + c.margin * 2) { this.startChaseLap(false); }

    const P = CHASE_PATTERNS[c.pattern];
    c.t += dt;

    /* パターンが目標の速さを決め、今の速さをそこへ近づける */
    P.update(this, c, dt);
    c.vR += (c.targetR - c.vR) * (1 - Math.exp(-c.accR * dt));
    c.vH += (c.targetH - c.vH) * (1 - Math.exp(-c.accH * dt));
    c.sR += c.vR * dt;
    c.sH += c.vH * dt;

    /* ハートは決して追いつかない */
    if (c.sR - c.sH < c.gapMin) {
      c.sH = c.sR - c.gapMin;
      c.vH = Math.min(c.vH, c.vR);
    }
    const gap = c.sR - c.sH;

    /* ---- 宵ちゃん ---- */
    c.runner.setPosition(this.chaseX(c.sR), P.track(c, c.sR));

    /* 走る向きを向く（ふり返っているときは逆向き）。元の画像の向きは GAME.CHARA.facing */
    const facing = c.facingBack ? -c.dir : c.dir;
    const imageFacing = GAME.CHARA.facing === 'left' ? -1 : 1;
    c.img.setFlipX(facing !== imageFacing);

    /* 速いほど前のめり */
    const lean = c.facingBack ? -c.dir * 4 : c.dir * Math.min(16, c.vR / 28);
    c.runner.angle = Phaser.Math.Linear(c.runner.angle, lean, 0.2);

    /* 跳ねる：速いほど高く・速く。止まっているときは小さく息をする */
    let imgY = 0;
    if (!P.noBob) {
      c.bob += dt * (3 + c.vR / 35);
      imgY = -Math.abs(Math.sin(c.bob)) * (c.vR > 10 ? Math.min(14, 4 + c.vR / 30) : 1.5);
    }
    if (c.jumpT > 0) {
      /* びっくりジャンプ */
      c.jumpT = Math.max(0, c.jumpT - dt);
      imgY -= 32 * Math.sin(Math.PI * (1 - c.jumpT / 0.36));
    }
    c.img.y = imgY;

    /* 速く走っているときは土ぼこり、休んでいるときは汗 */
    c.puffLeft -= dt;
    if (!P.noBob && c.vR > 320 && c.puffLeft <= 0) {
      c.puffLeft = 0.09;
      this.dustPuff(c.runner.x - c.dir * 30, c.runner.y + c.img.displayHeight / 2 - 12);
    }
    c.sweatLeft -= dt;
    if (c.state === 'rest' && c.vR < 30 && c.sweatLeft <= 0) {
      c.sweatLeft = 0.32;
      this.sweatDrop();
    }

    /* ---- ハート：近いほどドキドキが速くなる ---- */
    const near = Phaser.Math.Clamp((320 - gap) / 170, 0, 1);
    c.beat += dt * (9 + 10 * near);
    c.heart.setScale(c.heartScale * (1 + (0.06 + 0.04 * near) * Math.sin(c.beat)));
    const shiver = (c.state === 'look') ? (Math.random() - 0.5) * 4 : 0;
    c.heart.setPosition(this.chaseX(c.sH) + shiver, P.track(c, c.sH));
  }

  /* 宵ちゃんの頭の上に「!」「?」を出す */
  chaseMark(label, color) {
    const c = this.chase;
    const t = UI.text(this, 0, -c.img.displayHeight / 2 - 10, label, 42, color || '#ff2f55', { strokeThickness: 0, shadow: false });
    t.setStroke('#ffffff', 7);
    t.setScale(0.3);
    c.runner.add(t);
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.out' });
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 16,
      delay: 460,
      duration: 200,
      onComplete: () => t.destroy()
    });
  }

  /* 休憩中の汗 */
  sweatDrop() {
    const c = this.chase;
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = c.runner.x + side * 34;
    const y = c.runner.y - c.img.displayHeight * 0.3;
    const drop = this.add.image(x, y, 'spark').setTint(0x7fc8ff).setScale(0.42, 0.62).setDepth(3);
    this.tweens.add({
      targets: drop,
      x: x + side * 22,
      y: y + 14,
      alpha: 0,
      duration: 520,
      ease: 'Quad.in',
      onComplete: () => drop.destroy()
    });
  }

  dustPuff(x, y) {
    const puff = this.add.image(x, y, 'spark').setDepth(0).setAlpha(0.7).setScale(Phaser.Math.FloatBetween(0.9, 1.4));
    this.tweens.add({
      targets: puff,
      y: y - 10,
      scale: puff.scale * 1.8,
      alpha: 0,
      duration: 420,
      ease: 'Quad.out',
      onComplete: () => puff.destroy()
    });
  }

  update(time, delta) {
    this.updateChaseDemo(delta);
  }

  /* タイトル画面で下から浮かんでくる飾りのハート */
  demoHearts() {
    const tints = [0xff4f8b, 0xff9ec2, 0xffffff];
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(30, GAME.WIDTH - 30);
        const heart = UI.heartIcon(this, x, GAME.HEIGHT + 40, Phaser.Math.Between(22, 46), Phaser.Utils.Array.GetRandom(tints))
          .setAlpha(0.5)
          .setDepth(-70);
        this.tweens.add({
          targets: heart,
          y: -40,
          x: x + Phaser.Math.Between(-60, 60),
          angle: Phaser.Math.Between(-40, 40),
          duration: Phaser.Math.Between(5200, 7800),
          onComplete: () => heart.destroy()
        });
      }
    });
  }

  drawHighScore(x, y) {
    const best = ScoreStore.load();

    UI.panel(this, x, y, 452, 132, { radius: 22, alpha: 0.92 });
    UI.text(this, x, y - 44, 'HI-SCORE', 22, '#4a6699', { strokeThickness: 0 });

    if (!best) {
      UI.text(this, x, y + 14, 'まだ記録がありません', 26, '#4a6699', { strokeThickness: 0 });
      return;
    }

    UI.text(this, x, y - 2, best.score + ' 回', 52, '#ff4f8b', { strokeThickness: 0 })
      .setShadow(0, 3, 'rgba(22,48,92,0.25)', 4, false, true);

    UI.text(this, x, y + 42,
      'のがした ' + best.miss + ' 回' + (best.date ? '　(' + best.date + ')' : ''),
      20, '#16305c', { strokeThickness: 0 });
  }

  startGame() {
    if (this.starting) { return; }
    this.starting = true;

    Sfx.start();
    this.cameras.main.fadeOut(260, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game');
    });
  }
}
