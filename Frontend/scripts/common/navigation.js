
/*
 * FoodConnect - Navigation
 * Handles navigation, login state, profile icon and mobile menu.
 */

const navigationPages = [
  { label: "Home", page: "home" },
  { label: "Who can take part", page: "domains" },
  { label: "Food safety guide", page: "guide" },
  { label: "Hall of Fame", page: "fame" },
  { label: "Available food", page: "listings" },
  { label: "Log in", page: "login", guestOnly: true },
  { label: "Register", page: "register", guestOnly: true },
  { label: "Profile", page: "dashboard", loggedInOnly: true }
];

function go(page) {
  const allowedPages = navigationPages.map((item) => item.page);

  if (!allowedPages.includes(page)) return;

  window.location.href = `${page}.html`;
}

async function renderNavigation() {
  const nav = document.querySelector("#nav");
  const header = document.querySelector("header");

  if (!nav || !header) return;

  let user = null;

  try {
    const result = await apiRequest("current-user.php");
    user = result.user || null;
  } catch (error) {
    user = null;
  }

  const loggedIn = Boolean(user);
  const currentPage = document.body.dataset.page;

  const links = navigationPages.filter((item) => {
    if (item.guestOnly && loggedIn) return false;
    if (item.loggedInOnly && !loggedIn) return false;
    return true;
  });

  nav.innerHTML = links.map((item) => {
    const active =
      item.page === currentPage ||
      (item.page === "dashboard" && currentPage === "dash");

    return `
      <a
        href="${item.page}.html"
        class="${item.page === "dashboard" ? "profile-menu-link" : ""}"
        ${active ? 'aria-current="page"' : ""}
      >
        ${item.label}
      </a>
    `;
  }).join("");

  // Remove old profile icons before recreating the icon.
  header.querySelectorAll(".profile-icon-link").forEach((icon) => {
    icon.remove();
  });

  if (loggedIn) {
    // Create the profile icon.
    const profileLink = document.createElement("a");

    profileLink.href = "dashboard.html";
    profileLink.className = "profile-icon-link";
    profileLink.setAttribute("aria-label", "Open profile");
    profileLink.setAttribute("title", "Profile");

    profileLink.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3.5"></circle>
        <path d="M5 20a7 7 0 0 1 14 0"></path>
      </svg>
    `;

    // Add Logout as the last item inside the navigation.
    const logoutButton = document.createElement("button");

    logoutButton.type = "button";
    logoutButton.className = "logout-btn";
    logoutButton.textContent = "Logout";

    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Logging out...";

      try {
        await apiRequest("logout.php", {
          method: "POST",
          body: JSON.stringify({})
        });

        window.location.href = "home.html";
      } catch (error) {
        logoutButton.disabled = false;
        logoutButton.textContent = "Logout";

        alert(error.message || "Logout failed. Please try again.");
      }
    });

    // Put Profile immediately after Available food.
    const availableFoodLink = [...nav.querySelectorAll("a")].find(
      (link) => link.getAttribute("href") === "listings.html"
    );

    if (availableFoodLink) {
      availableFoodLink.insertAdjacentElement("afterend", profileLink);
    } else {
      nav.appendChild(profileLink);
    }

    // Profile is before Logout.
    nav.appendChild(logoutButton);
  }

  // Close the mobile menu after choosing a page.
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });
}

function toggleMenu(forceState) {
  const nav = document.querySelector("#nav");
  const backdrop = document.querySelector("#backdrop");
  const burger = document.querySelector("#burger");

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
    burger.setAttribute(
      "aria-label",
      shouldOpen ? "Close menu" : "Open menu"
    );
  }
}

document.addEventListener("DOMContentLoaded", renderNavigation);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleMenu(false);
  }
});
