
/*
 * FoodConnect - Navigation
 * Handles page navigation and mobile menu interactions.
 */

const navigationPages = [
  { label: 'Home', page: 'home' },
  { label: 'Who can take part', page: 'domains' },
  { label: 'Food safety guide', page: 'guide' },
  { label: 'Hall of Fame', page: 'fame' },
  { label: 'Available food', page: 'listings' },
  { label: 'Log in', page: 'login' },
  { label: 'Register', page: 'register' },
  { label: 'Dashboard', page: 'dashboard' }
];

function go(page) {
  const allowedPages = navigationPages.map((item) => item.page);

  if (!allowedPages.includes(page)) return;

  // Pages are stored inside frontend/pages/.
  window.location.href = `pages/${page}.html`;
}

function renderNavigation() {
  const nav = $('#nav');
  if (!nav) return;

  const currentPage = document.body.dataset.page;

  nav.innerHTML = navigationPages.map((item) => {
    const active = item.page === currentPage;

    return `
      <a href="${item.page}.html"
         ${active ? 'aria-current="page"' : ''}>
        ${item.label}
      </a>
    `;
  }).join('');
}

function toggleMenu(forceState) {
  const nav = $('#nav');
  const backdrop = $('#backdrop');
  const burger = $('#burger');

  if (!nav) return;

  const shouldOpen = typeof forceState === 'boolean'
    ? forceState
    : !nav.classList.contains('open');

  nav.classList.toggle('open', shouldOpen);

  if (backdrop) {
    backdrop.classList.toggle('show', shouldOpen);
  }

  if (burger) {
    burger.setAttribute('aria-expanded', String(shouldOpen));
    burger.setAttribute(
      'aria-label',
      shouldOpen ? 'Close menu' : 'Open menu'
    );
  }
}

document.addEventListener('DOMContentLoaded', renderNavigation);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    toggleMenu(false);
  }
});
