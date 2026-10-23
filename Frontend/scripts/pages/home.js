/*
 * FoodConnect - Home Page
 * Loads impact statistics from the PHP backend.
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
      statElements.meals.textContent = (
        Number(stats.total_meals) || 0
      ).toLocaleString();
    }

    if (statElements.donations) {
      statElements.donations.textContent = (
        Number(stats.total_donations) || 0
      ).toLocaleString();
    }

    if (statElements.donors) {
      statElements.donors.textContent = (
        Number(stats.total_donors) || 0
      ).toLocaleString();
    }

    if (statElements.organisations) {
      statElements.organisations.textContent = (
        Number(stats.total_organisations) || 0
      ).toLocaleString();
    }
  } catch (error) {
    console.error("Unable to load FoodConnect statistics:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadHomeStats);

document.addEventListener("DOMContentLoaded", async () => {
  const availableFoodLink = $("#homeAvailableFood");
  if (!availableFoodLink) return;

  try {
    const result = await apiRequest("current-user.php");
    if (result.user?.role === "donor") availableFoodLink.hidden = true;
  } catch (error) {
    // Guests and unavailable sessions can still browse available listings.
  }
});
