/* =========================================================
   localStorage 保存まわり
   ハイスコア（つかまえた回数）と、その記録を出したときのミス数を保存する
   ※ game1 と同じ localhost で動かしても混ざらないよう、キーを分けている
   ========================================================= */
const ScoreStore = {
  KEY: 'lovecatch.best',

  /* 保存済みのベスト記録を取得（無ければ null） */
  load: function () {
    try {
      const raw = window.localStorage.getItem(this.KEY);
      if (!raw) { return null; }
      const d = JSON.parse(raw);
      if (!d || typeof d.score !== 'number') { return null; }
      return {
        score: d.score | 0,
        miss: d.miss | 0,
        date: typeof d.date === 'string' ? d.date : ''
      };
    } catch (e) {
      return null;
    }
  },

  save: function (record) {
    try {
      window.localStorage.setItem(this.KEY, JSON.stringify(record));
      return true;
    } catch (e) {
      /* プライベートモード等で失敗しても遊べるようにする */
      return false;
    }
  },

  /* 結果を登録。ハイスコア更新なら true */
  submit: function (result) {
    const best = this.load();
    if (best && result.score <= best.score) { return false; }

    const d = new Date();
    const date = d.getFullYear() + '/' +
      ('0' + (d.getMonth() + 1)).slice(-2) + '/' +
      ('0' + d.getDate()).slice(-2);

    this.save({ score: result.score, miss: result.miss, date: date });
    return true;
  },

  clear: function () {
    try { window.localStorage.removeItem(this.KEY); } catch (e) { /* noop */ }
  }
};

