/*
 * FoodConnect - Navigation
 * Handles navigation, login state and mobile menu.
 */

const navigationPages = [
  { label: "Home", page: "home" },
  { label: "Who can take part", page: "domains" },
  { label: "Food safety guide", page: "guide" },
  { label: "Hall of Fame", page: "fame" },
  { label: "Available food", page: "listings" },
  { label: "Log in", page: "login", guestOnly: true },
  { label: "Register", page: "register", guestOnly: true },
  { label: "Dashboard", page: "dashboard", loggedInOnly: true },
];

function go(page) {
  const allowedPages = navigationPages.map((item) => item.page);

  if (!allowedPages.includes(page)) return;

  window.location.href = `${page}.html`;
}

async function renderNavigation() {
  const nav = $("#nav");
  if (!nav) return;

  let loggedIn = false;

  try {
    const result = await apiRequest("current-user.php");
    loggedIn = Boolean(result.user);
  } catch (error) {
    loggedIn = false;
  }

  const currentPage = document.body.dataset.page;

  const links = navigationPages.filter((item) => {
    if (item.guestOnly && loggedIn) return false;
    if (item.loggedInOnly && !loggedIn) return false;
    return true;
  });

  nav.innerHTML = links
    .map((item) => {
      const active = item.page === currentPage;

      return `
      <a href="${item.page}.html"
         ${active ? 'aria-current="page"' : ""}>
        ${item.label}
      </a>
    `;
    })
    .join("");

  nav.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });

  if (loggedIn) {
    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Log out";

    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();
      logoutLink.textContent = "Logging out...";
      logoutLink.style.pointerEvents = "none";

      try {
        await apiRequest("logout.php", {
          method: "POST",
          body: JSON.stringify({}),
        });

        window.location.href = "home.html";
      } catch (error) {
        logoutLink.textContent = "Log out";
        logoutLink.style.pointerEvents = "";
        alert(error.message || "Logout failed. Please try again.");
      }
    });

    nav.appendChild(logoutLink);
  }
}

function toggleMenu(forceState) {
  const nav = $("#nav");
  const backdrop = $("#backdrop");
  const burger = $("#burger");

  if (!nav) return;

  const shouldOpen =
    typeof forceState === "boolean"
      ? forceState
      : !nav.classList.contains("open");

  nav.classList.toggle("open", shouldOpen);

  if (backdrop) {
    backdrop.classList.toggle("show", shouldOpen);
  }

  if (burger) {
    burger.setAttribute("aria-expanded", String(shouldOpen));
    burger.setAttribute("aria-label", shouldOpen ? "Close menu" : "Open menu");
  }
}

document.addEventListener("DOMContentLoaded", renderNavigation);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleMenu(false);
  }
});
