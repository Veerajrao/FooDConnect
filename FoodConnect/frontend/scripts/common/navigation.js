/* ==========================================================
   FoodConnect - shared navigation (loaded on every page)
   Page links, top menu, mobile side menu, log out.
   Needs helpers.js and data.js loaded first.
   ========================================================== */

// Every page of the site and its HTML file. All pages sit side by side in frontend/pages/.
const PAGE_URLS = {
  home: 'home.html',
  domains: 'domains.html',
  guide: 'guide.html',
  fame: 'fame.html',
  listings: 'listings.html',
  login: 'login.html',
  register: 'register.html',
  dash: 'dashboard.html'
};

// Go to a page by name, e.g. go('home') opens home.html
function go(page) {
  location.href = PAGE_URLS[page];
}

// Runs once when a page opens. Each page names itself in <body data-page="...">.
// Builds the menu and sends logged-out visitors away from the dashboard.
function route() {
  const p = document.body.dataset.page;
  if (p === 'dash' && !me) { go('login'); return; }   // dashboard needs a login
  renderNav(p);
  toggleMenu(false);
}

// Opens/closes the mobile side menu. Pass true/false to force a state.
function toggleMenu(open) {
  const on = typeof open === 'boolean' ? open : !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', on);
  const b = document.getElementById('burger');
  if (b) { b.setAttribute('aria-expanded', on); b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 800) toggleMenu(false); });

// Builds the top menu. Logged-out users see Log in / Join; logged-in users see Dashboard / Log out.
function renderNav(p) {
  const links = [
    ['home', 'Home'],
    ['domains', 'Who can join'],
    ['guide', 'Guide'],
    ['fame', 'Hall of Fame'],
    ['listings', 'Available food']
  ];
  let html = links.map(([k, v]) => `<a href="${PAGE_URLS[k]}" class="${p === k ? 'on' : ''}">${v}</a>`).join('');
  html += me
    ? `<a href="${PAGE_URLS.dash}" class="cta">My dashboard</a><button onclick="logout()">Log out</button>`
    : `<a href="${PAGE_URLS.login}">Log in</a><a href="${PAGE_URLS.register}" class="cta">Join</a>`;
  $('#nav').innerHTML = html;
}

// Ends the session and returns to the home page
function logout() {
  me = null;
  DB.set('me', null);
  go('home');
}

route();   // build the menu for this page
