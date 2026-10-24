
/*
 * FoodConnect - Accessible Welcome Modal
 * Handles keyboard navigation, focus management and login reminders.
 */

const WELCOME_POPUP_INTERVAL = 30 * 1000;

let previousFocus = null;
let welcomeReminderTimer = null;
let reminderDismissed = false;
let loginCheckInProgress = false;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(",");

function getModalFocusables(modal) {
  return [...modal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) => {
      return (
        element.getClientRects().length > 0 &&
        !element.disabled &&
        element.getAttribute("aria-hidden") !== "true" &&
        (element.type !== "radio" ||
          element.checked ||
          ![...modal.querySelectorAll(
            `input[type="radio"][name="${element.name}"]`
          )].some((radio) => radio.checked))
      );
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

  // Do not reopen the automatic reminder after manual dismissal.
  reminderDismissed = true;

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
    if (!modal.hidden) closeWelcome();
    return;
  }

  // Show the initial welcome popup for guests.
  openWelcome();

  // Check login status periodically, without forcing the popup open again.
  if (welcomeReminderTimer !== null) {
    clearInterval(welcomeReminderTimer);
  }

  welcomeReminderTimer = setInterval(async () => {
    if (loginCheckInProgress) return;

    loginCheckInProgress = true;

    try {
      if (await isLoggedIn()) {
        clearInterval(welcomeReminderTimer);
        welcomeReminderTimer = null;

        const currentModal = document.getElementById("welcome");

        if (currentModal && !currentModal.hidden) {
          closeWelcome();
        }
      }
    } finally {
      loginCheckInProgress = false;
    }
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
  const activeElement = document.activeElement;

  if (!modal.contains(activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// Close when the user clicks the popup backdrop.
document.addEventListener("click", (event) => {
  const modal = document.getElementById("welcome");

  if (modal && event.target === modal) {
    closeWelcome();
  }
});

// Preserve existing HTML onclick handlers.
window.openWelcome = openWelcome;
window.closeWelcome = closeWelcome;

// Start after the page is ready.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWelcomeReminder);
} else {
  startWelcomeReminder();
}
