(function (global) {
  const KEY = 'dietAppState_v1';

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function clearState() {
    localStorage.removeItem(KEY);
  }

  global.DietApp = global.DietApp || {};
  global.DietApp.Storage = { loadState, saveState, clearState };
})(window);
