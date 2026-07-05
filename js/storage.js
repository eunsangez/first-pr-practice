(function (global) {
  const KEY = 'dietAppState_v2';

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // 저장 공간이 막혀 있어도(사파리 프라이빗 모드, 샌드박스 iframe 등) 앱은 계속 동작해야 한다.
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      // no-op
    }
  }

  global.DietApp = global.DietApp || {};
  global.DietApp.Storage = { loadState, saveState, clearState };
})(window);
