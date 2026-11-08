/*
 * Storage. Uses chrome.storage.sync inside the extension (follows your
 * Chrome profile across machines). Falls back to localStorage when the page
 * is opened as a plain file, which is handy while designing.
 */
(function (root) {
  'use strict';

  var KEYS = ['settings', 'rules'];
  var RULE_COUNT = 12;
  var hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

  function normalize(raw) {
    raw = raw || {};
    var rules = Array.isArray(raw.rules) ? raw.rules.slice(0, RULE_COUNT) : [];
    while (rules.length < RULE_COUNT) rules.push('');
    rules = rules.map(function (r) { return typeof r === 'string' ? r : ''; });
    var s = raw.settings && typeof raw.settings === 'object' ? raw.settings : null;
    return { settings: s, rules: rules };
  }

  function localGet() {
    var out = {};
    KEYS.forEach(function (k) {
      try {
        var v = localStorage.getItem('weeks.' + k);
        if (v) out[k] = JSON.parse(v);
      } catch (e) { /* storage blocked or corrupt: start fresh */ }
    });
    return out;
  }

  function localSet(obj) {
    Object.keys(obj).forEach(function (k) {
      try { localStorage.setItem('weeks.' + k, JSON.stringify(obj[k])); } catch (e) { /* ignore */ }
    });
  }

  var Store = {
    RULE_COUNT: RULE_COUNT,

    load: function () {
      if (!hasChrome) return Promise.resolve(normalize(localGet()));
      return new Promise(function (resolve) {
        chrome.storage.sync.get(KEYS, function (res) {
          resolve(normalize(chrome.runtime.lastError ? {} : res));
        });
      });
    },

    save: function (obj) {
      if (!hasChrome) { localSet(obj); return Promise.resolve(); }
      return new Promise(function (resolve, reject) {
        chrome.storage.sync.set(obj, function () {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve();
        });
      });
    },

    // Removes everything this extension has stored.
    clear: function () {
      if (!hasChrome) {
        KEYS.forEach(function (k) {
          try { localStorage.removeItem('weeks.' + k); } catch (e) { /* ignore */ }
        });
        return Promise.resolve();
      }
      return new Promise(function (resolve) {
        chrome.storage.sync.remove(KEYS, function () { resolve(); });
      });
    },

    // Fires when another tab changes settings or rules.
    onChange: function (cb) {
      if (hasChrome) {
        chrome.storage.onChanged.addListener(function (changes, area) {
          if (area !== 'sync') return;
          if (changes.settings || changes.rules) Store.load().then(cb);
        });
      } else {
        root.addEventListener('storage', function (e) {
          if (e.key && e.key.indexOf('weeks.') === 0) Store.load().then(cb);
        });
      }
    }
  };

  root.Store = Store;
})(this);
