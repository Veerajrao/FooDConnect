
/*
 * FoodConnect - Participation Domains
 * Handles navigation and interactions on the domains page.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Handle internal links to sections on the current page.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');

      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        history.replaceState(null, '', targetId);
      }
    });
  });
});
