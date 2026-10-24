
/*
 * FoodConnect - Accessible Welcome Modal
 * Supports keyboard navigation, focus management and reminders.
 */

const WELCOME_POPUP_INTERVAL = 30 * 1000;

let previousFocus = null;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function getModalFocusables(modal) {
  return [...modal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) => {
      const visible = element.getClientRects().length > 0;
      const enabled = !element.hasAttribute("disabled");
      const selectedRadio =
        element.type !== "radio" || element.checked;

      return visible && enabled && selectedRadio;
    }
  );
}

function openWelcome() {
  if (document.body.dataset.page !== "home") return;

  const modal = document.getElementById("welcome");
  if (!modal) return;

  const isOpening = modal.hidden;

  if (isOpening) {
    const activeElement = document.activeElement;

    previousFocus =
      activeElement && activeElement !== document.body
        ? activeElement
        : null;
  }

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  // Move keyboard focus into the popup when it opens.
  if (isOpening) {
    const focusables = getModalFocusables(modal);
    const initialFocus =
      modal.querySelector(".modal-x") || focusables[0];

    if (initialFocus) {
      initialFocus.focus();
    } else {
      modal.setAttribute("tabindex", "-1");
      modal.focus();
    }
  }
}

function closeWelcome() {
  const modal = document.getElementById("welcome");
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  // Return focus to the element that opened the popup.
  const focusTarget = previousFocus;
  previousFocus = null;

  if (
    focusTarget &&
    focusTarget.isConnected &&
    typeof focusTarget.focus === "function"
  ) {
    focusTarget.focus();
  }
}

async function isLoggedIn() {
  try {
    const result = await getCurrentUser();
    return Boolean(result?.user);
  } catch (error) {
    return false;
  }
}

async function startWelcomeReminder() {
  if (document.body.dataset.page !== "home") return;

  const modal = document.getElementById("welcome");
  if (!modal) return;

  if (await isLoggedIn()) {
    closeWelcome();
    return;
  }

  // Show the first popup immediately.
  openWelcome();

  // Repeat the reminder every 30 seconds for guests.
  setInterval(async () => {
    if (await isLoggedIn()) {
      closeWelcome();
      return;
    }

    openWelcome();
  }, WELCOME_POPUP_INTERVAL);
}

// Keyboard accessibility: Escape and Tab handling.
document.addEventListener("keydown", (event) => {
  const modal = document.getElementById("welcome");

  if (!modal || modal.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeWelcome();
    return;
  }

  if (event.key !== "Tab") return;

  const focusables = getModalFocusables(modal);

  if (focusables.length === 0) {
    event.preventDefault();
    modal.setAttribute("tabindex", "-1");
    modal.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  // Keep keyboard focus inside the open popup.
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !modal.contains(document.activeElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      !modal.contains(document.activeElement))
  ) {
    event.preventDefault();
    first.focus();
  }
});

// Close when the user clicks the backdrop.
document.addEventListener("click", (event) => {
  const modal = document.getElementById("welcome");

  if (modal && event.target === modal) {
    closeWelcome();
  }
});

// Keep the existing HTML onclick handlers working.
window.openWelcome = openWelcome;
window.closeWelcome = closeWelcome;

// Start after the page is ready.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWelcomeReminder);
} else {
  startWelcomeReminder();
}
