// utils/storage.js
// Thin wrapper around chrome.storage.local.
// Used by content.js (extension world) to persist preferences.

const Storage = {
  /**
   * get — retrieve one or more keys.
   * @param {string|string[]} keys
   * @returns {Promise<object>}
   */
  get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * set — persist key-value pairs.
   * @param {object} items
   * @returns {Promise<void>}
   */
  set(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * remove — delete keys.
   * @param {string|string[]} keys
   * @returns {Promise<void>}
   */
  remove(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
};

// Exposed as a plain const — accessible to content.js in the same content-script scope.
const GuptXStorage = Storage;
