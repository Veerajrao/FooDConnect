/* ==========================================================
   FoodConnect - shared helpers (loaded on every page)
   Short selector, browser-storage wrapper, safe-text and message helpers.
   ========================================================== */

// Short name for document.querySelector, e.g. $('#home')
const $ = s => document.querySelector(s);

// Small storage wrapper: saves and reads data in the browser (localStorage).
// Everything is wrapped in try/catch so the site still works if storage is blocked.
const DB = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem('fc_' + key)) || fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('fc_' + key, JSON.stringify(value));
    } catch (e) {}
  }
};

// Makes user-typed text safe to show inside HTML (prevents script injection)
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

// Finds a user by id (used to show a donor's or organisation's name)
const uid = id => users.find(u => u.id === id) || { name: 'Unknown' };

// Shows a green success message, or a red error message when err is true
function msg(el, text, err) {
  el.textContent = text;
  el.className = 'msg' + (err ? ' err' : '');
  el.style.display = 'block';
}
