/* =========================================================
   ゲーム全体の設定値
   ========================================================= */
const GAME = {
  WIDTH: 540,
  HEIGHT: 960,

  /* ページの名前（ブラウザのタブに出る名前は index.html の <title>） */
  TITLE: 'HARTCATCH宵ちゃん！',

  /* 1ゲームの長さ（秒） */
  DURATION: 30,
  /* 何秒ごとに難易度を上げるか */
  PHASE_SECONDS: 10,

  /*
    ハート
      SIZE     : 表示幅（px）。つかまえられる範囲もこの大きさのハート形
      LIFE     : 押してから消えるまでの時間（ms）。それまでに指を離さないと時間切れ
      WARN     : 残りがこの時間（ms）を切ると点滅して知らせる
      OFFSET_Y : 指の位置からハートをずらす量（マイナスで上。指でハートが隠れるのが気になるとき用）
  */
  HEART: {
    SIZE: 150,
    LIFE: 3000,
    WARN: 1000,
    OFFSET_Y: 0
  },

  /* ハートのテクスチャ（BootScene で生成）。inner がハート本体の幅で、判定範囲と一致する */
  HEART_TEX: { w: 300, h: 290, inner: 250 },

  /* キャラが動き回る範囲（HUD の下 〜 画像の下端の限界） */
  FIELD: { top: 140, bottom: 900 },

  /*
    つかまえるキャラクター
      file       : assets/img/ 以下の画像
      width      : ゲーム中の表示幅（高さは元画像の比率で自動計算）
      titleWidth : タイトル画面（ハートから逃げる演出）での表示幅
      facing     : 元の画像が向いている方向（'left' / 'right'）。タイトルの演出・ゲーム中ともに、進む方向を向くように左右反転する
      core       : つかまえる判定の中心になる部分。元画像のピクセル基準（x / y は画像左上からのオフセット）
                   この四角の中心がハートの中に入っていれば「つかまえた」になる
  */
  CHARA: {
    id: 'chara',
    file: 'chara_1.png',              /* 200 x 200（周囲に透明の余白あり） */
    width: 120,
    titleWidth: 140,
    facing: 'left',
    core: { w: 164, h: 113, x: 23, y: 67 }
  },

  /*
    キャラの大きさの変動（width を 1 としたときの倍率）
    SCALE_MIN 〜 SCALE_MAX の間で、SCALE_TIME_MIN 〜 SCALE_TIME_MAX(ms) かけてなめらかに大きくなったり小さくなったりする
  */
  CHARA_SCALE: {
    SCALE_MIN: 0.9,
    SCALE_MAX: 1.1,
    SCALE_TIME_MIN: 500,
    SCALE_TIME_MAX: 1100
  },

  /* つかまえてから、次のキャラが出てくるまで（ms） */
  RESPAWN_DELAY: 450,

  /*
    難易度フェーズ（0-10秒 / 10-20秒 / 20-30秒）
    speedMin / speedMax : 移動速度(px/秒)
    turnMin / turnMax   : 向きを変えるまでの時間(ms)
    dashRate            : 向きを変えたときにダッシュする確率
  */
  PHASES: [
    { speedMin: 190, speedMax: 250, turnMin: 700, turnMax: 1500, dashRate: 0 },
    { speedMin: 240, speedMax: 320, turnMin: 550, turnMax: 1200, dashRate: 0.15 },
    { speedMin: 300, speedMax: 400, turnMin: 400, turnMax: 950, dashRate: 0.3 }
  ],
  /* ダッシュ中の速度倍率と長さ(ms) */
  DASH_SCALE: 1.8,
  DASH_TIME: 380,

  /*
    リザルトで表示する称号（上から順に調べて、最初に当てはまったものになる）
    min     : つかまえた回数がこの回数以上
    maxMiss : （省略可）ミスがこの回数以下。付けると「ミスが少ないときだけ」の称号になる
    special : （省略可）true にすると、リザルトで特別演出（ResultScene.playLoveEvent）が流れる
  */
  RANKS: [
    { min: 22, maxMiss: 0, label: '両想い', color: 0xff4f8b, shade: 0xc2245e, special: true },
    { min: 15, label: 'ラブマスター', color: 0xffb61f, shade: 0xc98100 },
    { min: 10, label: 'ハートハンター', color: 0xff8a3d, shade: 0xc95f17 },
    { min: 5, label: '恋のみならい', color: 0x35bf6a, shade: 0x218a49 },
    { min: 0, label: 'かたおもい', color: 0x8fa3d9, shade: 0x5d73ab }
  ],

  /*
    タイトルロゴ（assets/img/logo.png 1024 x 1024）
      LOGO_TRIM   : 透明な余白を除いた、ロゴが描かれている範囲（元画像のピクセル基準）
                    ロゴを書き出し直して余白が変わったら、ここを合わせる
      LOGO_HEIGHT : タイトル画面での表示の高さ（幅は比率で自動）
      LOGO_Y      : タイトル画面でのロゴの中心のY座標
  */
  LOGO_TRIM: { x: 116, y: 152, w: 778, h: 704 },
  LOGO_HEIGHT: 250,
  LOGO_Y: 144,

  /* 当たり判定を目で確認したいとき true（ハートの判定範囲とキャラの判定点を表示） */
  DEBUG: false,

  /* 地面（草地）の高さ */
  GROUND_H: 84,

  /* 配色 */
  COLOR: {
    skyTop: 0x63b4ff,
    skyBottom: 0xdcf1ff,
    ground: 0x7dd47f,
    groundDark: 0x54b45c,
    ink: 0x16305c,
    inkSoft: 0x4a6699,
    white: 0xffffff,
    heart: 0xff4f8b,
    heartWarn: 0xff2f55,
    lost: 0x9aa7b8,
    panel: 0xffffff
  }
};

/* Phaser のテキストで使うフォント */
const FONT = '"Yu Gothic", "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif';

/* 経過秒数からフェーズ番号を求める */
GAME.phaseIndexOf = function (elapsedSec) {
  const i = Math.floor(elapsedSec / GAME.PHASE_SECONDS);
  return Phaser.Math.Clamp(i, 0, GAME.PHASES.length - 1);
};


/* つかまえた回数とミスの回数から称号を求める */
GAME.rankOf = function (score, miss) {
  for (let i = 0; i < GAME.RANKS.length; i++) {
    const r = GAME.RANKS[i];
    if (score >= r.min && (r.maxMiss === undefined || miss <= r.maxMiss)) { return r; }
  }
  return GAME.RANKS[GAME.RANKS.length - 1];
};

/* 一番下以外の称号かどうか（演出の出し分け用） */
GAME.isGoodRank = function (rank) {
  return rank !== GAME.RANKS[GAME.RANKS.length - 1];
};
