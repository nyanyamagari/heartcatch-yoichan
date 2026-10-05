/* =========================================================
   BootScene : 画像の読み込みと、コードで作るテクスチャの生成
   ========================================================= */
class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.drawLoadingUI();

    /* キャラ（キーは config の id） */
    this.load.image(GAME.CHARA.id, 'assets/img/' + GAME.CHARA.file);

    this.load.image('logo', 'assets/img/logo.png');

    this.load.on('loaderror', function (file) {
      console.warn('[boot] 読み込みに失敗しました: ' + file.key + ' (' + file.url + ')');
    });
  }

  create() {
    /* ロゴは透明な余白を除いた部分を 'trim' フレームとして使う */
    const t = GAME.LOGO_TRIM;
    this.textures.get('logo').add('trim', 0, t.x, t.y, t.w, t.h);

    /* 雲・粒子・ハートはコードで生成する */
    this.makeCloudTexture('cloud');
    this.makeSparkTexture('spark');
    this.makeHeartTexture('heart');
    this.makeSmallHeartTexture('heart_small');

    this.scene.start('Title');
  }

  /* ---------- ローディング表示 ---------- */
  drawLoadingUI() {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;

    const bg = this.add.graphics();
    bg.fillGradientStyle(GAME.COLOR.skyTop, GAME.COLOR.skyTop, GAME.COLOR.skyBottom, GAME.COLOR.skyBottom, 1);
    bg.fillRect(0, 0, W, H);

    const label = this.add.text(W / 2, H / 2 - 60, 'NOW LOADING', {
      fontFamily: FONT,
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#16305c'
    }).setOrigin(0.5);
    label.setStroke('#ffffff', 5);

    const barW = 320;
    const barH = 20;
    const x = (W - barW) / 2;
    const y = H / 2;

    const frame = this.add.graphics();
    frame.fillStyle(0xffffff, 0.75);
    frame.fillRoundedRect(x - 4, y - 4, barW + 8, barH + 8, 12);

    const bar = this.add.graphics();

    this.load.on('progress', function (value) {
      bar.clear();
      bar.fillStyle(0xff4f8b, 1);
      bar.fillRoundedRect(x, y, Math.max(barH, barW * value), barH, 10);
    });
  }

  /* ---------- 雲 ---------- */
  makeCloudTexture(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(60, 58, 38);
    g.fillCircle(108, 46, 46);
    g.fillCircle(160, 60, 34);
    g.fillRoundedRect(40, 58, 140, 34, 17);
    g.generateTexture(key, 220, 100);
    g.destroy();
  }

  /* ---------- 粒子 ---------- */
  makeSparkTexture(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }

  /*
    ---------- つかまえるハート ----------
    中が透けて見える半透明のハート（中のキャラが見えるように）。
    本体の幅は GAME.HEART_TEX.inner で、GameScene は本体の幅が GAME.HEART.SIZE になるよう拡大縮小する。
  */
  makeHeartTexture(key) {
    const T = GAME.HEART_TEX;
    const cx = T.w / 2;
    const cy = T.h / 2;
    const color = GAME.COLOR.heart;
    const body = UI.heartPoints(cx, cy, T.inner, 96);

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    /* ふんわり光る外側 */
    g.fillStyle(color, 0.16);
    g.fillPoints(UI.heartPoints(cx, cy, T.inner + 36, 96), true);

    /* 中身（半透明） */
    g.fillStyle(color, 0.26);
    g.fillPoints(body, true);

    /* 縁取り：白 → ピンク */
    g.lineStyle(16, 0xffffff, 1);
    g.strokePoints(body, true, true);
    g.lineStyle(8, color, 1);
    g.strokePoints(body, true, true);

    /* 左上のつや */
    g.fillStyle(0xffffff, 0.6);
    g.fillEllipse(cx - T.inner * 0.27, cy - T.inner * 0.30, T.inner * 0.15, T.inner * 0.08);

    g.generateTexture(key, T.w, T.h);
    g.destroy();
  }

  /* ---------- 小さいハート（粒子・アイコン用。白で作って tint で色を付ける） ---------- */
  makeSmallHeartTexture(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillPoints(UI.heartPoints(32, 30, 60, 64), true);
    g.generateTexture(key, 64, 60);
    g.destroy();
  }
}
