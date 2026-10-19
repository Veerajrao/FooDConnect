
/*
 * FoodConnect - Welcome Modal
 * Handles opening and closing the welcome modal.
 */

function openWelcome() {
  const modal = $('#welcome');

  if (!modal) return;

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeWelcome() {
  const modal = $('#welcome');

  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

// Close the modal when the Escape key is pressed.
document.addEventListener('keydown', (event) => {
  const modal = $('#welcome');

  if (
    event.key === 'Escape' &&
    modal &&
    !modal.hidden
  ) {
    closeWelcome();
  }
});

// Close the modal when clicking its backdrop.
document.addEventListener('click', (event) => {
  const modal = $('#welcome');

  if (modal && event.target === modal) {
    closeWelcome();
  }
});

// Make functions available to existing inline HTML handlers.
window.openWelcome = openWelcome;
window.closeWelcome = closeWelcome;
