
/*
 * FoodConnect - Home Page
 * Loads impact statistics and handles guest access.
 */

async function loadHomeStats() {
  const statElements = {
    meals: $("#sMeals"),
    donations: $("#sDon"),
    donors: $("#sDonors"),
    organisations: $("#sOrgs"),
  };

  const elements = Object.values(statElements).filter(Boolean);

  if (elements.length === 0) return;

  elements.forEach((element) => {
    element.textContent = "—";
  });

  try {
    const result = await apiRequest("stats.php");
    const stats = result.stats || result;

    if (statElements.meals) {
      statElements.meals.textContent =
        (Number(stats.total_meals) || 0).toLocaleString();
    }

    if (statElements.donations) {
      statElements.donations.textContent =
        (Number(stats.total_donations) || 0).toLocaleString();
    }

    if (statElements.donors) {
      statElements.donors.textContent =
        (Number(stats.total_donors) || 0).toLocaleString();
    }

    if (statElements.organisations) {
      statElements.organisations.textContent =
        (Number(stats.total_organisations) || 0).toLocaleString();
    }
  } catch (error) {
    console.error("Unable to load FoodConnect statistics:", error);
  }
}

async function getHomeUser() {
  try {
    const result = await getCurrentUser();
    return result?.user || null;
  } catch (error) {
    return null;
  }
}

async function setupHomeAccess() {
  const user = await getHomeUser();

  // Hide Available Food links for donors.
  if (user?.role === "donor") {
    document
      .querySelectorAll('a[href="listings.html"]')
      .forEach((link) => {
        link.hidden = true;
      });
  }
}

// Handle both the homepage button and the navigation link.
document.addEventListener("click", async (event) => {
  if (document.body.dataset.page !== "home") return;

  const target =
    event.target instanceof Element
      ? event.target
      : event.target?.parentElement;

  const availableFoodLink = target?.closest(
    'a[href="listings.html"]'
  );

  if (!availableFoodLink || availableFoodLink.hidden) return;

  event.preventDefault();

  const user = await getHomeUser();

  if (user) {
    // Logged-in users can open the listings.
    window.location.href = "listings.html";
    return;
  }

  // Guests see the popup only after clicking Available Food.
  if (typeof window.openWelcome === "function") {
    window.openWelcome();
  } else {
    window.location.href = "login.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadHomeStats();
  setupHomeAccess();
});
