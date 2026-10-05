/* =========================================================
   エントリーポイント
   ・内部解像度は 540 x 960 固定（Scale Mode: NONE）
   ・キャンバスの中央配置と拡大縮小は css/style.css が担当する
   ========================================================= */
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: '#9fd3ff',
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  render: {
    antialias: true,
    roundPixels: true
  },
  input: {
    activePointers: 3
  },
  /* 長押しで遊ぶので、右クリック・長押しのメニューを出さない */
  disableContextMenu: true,
  scene: [BootScene, TitleScene, GameScene, ResultScene]
};

const game = new Phaser.Game(config);

/*
  CSSでキャンバスを引き伸ばしているため、ウィンドウサイズが変わったら
  タップ座標の換算値を作り直す。
*/
function refreshScale() {
  if (game && game.scale) { game.scale.refresh(); }
}

window.addEventListener('resize', refreshScale);
window.addEventListener('orientationchange', function () {
  window.setTimeout(refreshScale, 120);
});
game.events.once('ready', refreshScale);

/* 最初の操作でオーディオを有効化（ブラウザの自動再生制限対策） */
function unlockAudio() {
  Sfx.ensure();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
}
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
