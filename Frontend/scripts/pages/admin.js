
"use strict";

const API_BASE = "../../Backend/api/";

const message = document.getElementById("pageMessage");
const dashboardContent = document.getElementById("dashboardContent");
const refreshButton = document.getElementById("refreshButton");
const logoutButton = document.getElementById("logoutButton");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.hidden = false;
}

function cell(value) {
  const td = document.createElement("td");

  td.textContent =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return td;
}

function renderRows(bodyId, rows, columns) {
  const tbody = document.getElementById(bodyId);
  tbody.replaceChildren();

  if (!Array.isArray(rows) || rows.length === 0) {
    const tr = document.createElement("tr");
    const td = cell("No records found.");

    td.colSpan = columns.length;
    td.className = "empty";

    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((column) => {
      tr.appendChild(cell(row[column]));
    });

    tbody.appendChild(tr);
  });
}

function renderStats(stats) {
  const items = [
    ["Total users", stats.total_users],
    ["Donors", stats.total_donors],
    ["Organisations", stats.total_organisations],
    ["Total food listings", stats.total_listings],
    ["Available food", stats.available_food],
    ["Total requests", stats.total_requests],
    ["Pending requests", stats.pending_requests]
  ];

  const grid = document.getElementById("statsGrid");
  grid.replaceChildren();

  items.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "stat";

    const name = document.createElement("div");
    name.className = "stat-label";
    name.textContent = label;

    const number = document.createElement("div");
    number.className = "stat-value";
    number.textContent = Number(value ?? 0).toLocaleString();

    card.append(name, number);
    grid.appendChild(card);
  });
}

async function loadDashboard() {
  refreshButton.disabled = true;
  showMessage("Loading admin dashboard…");

  try {
    const response = await fetch(
      API_BASE + "admin-dashboard.php",
      {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      }
    );

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      window.location.replace("login.html");
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to load dashboard."
      );
    }

    if (!result.admin || !result.stats) {
      throw new Error(
        "The server returned incomplete dashboard data."
      );
    }

    document.getElementById("welcomeMessage").textContent =
      "Signed in as " +
      (result.admin.name || "Admin") +
      " (" +
      (result.admin.email || "") +
      ")";

    document.getElementById("lastUpdated").textContent =
      "Last refreshed: " + new Date().toLocaleString();

    renderStats(result.stats);

    renderRows("usersBody", result.users, [
      "id",
      "name",
      "email",
      "phone",
      "city",
      "role",
      "created_at"
    ]);

    renderRows("listingsBody", result.listings, [
      "id",
      "title",
      "kind",
      "qty",
      "donor_name",
      "status",
      "collect_before",
      "created_at"
    ]);

    renderRows("requestsBody", result.requests, [
      "id",
      "food_title",
      "requester_name",
      "status",
      "created_at",
      "updated_at"
    ]);

    dashboardContent.hidden = false;
    message.hidden = true;

  } catch (error) {
    dashboardContent.hidden = true;

    showMessage(
      error.message || "Unable to connect to the admin API.",
      true
    );

  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", loadDashboard);

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await fetch(API_BASE + "logout.php", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({})
    });

  } catch (error) {
    // Return to login even if the logout request fails.
  }

  window.location.replace("login.html");    
});

loadDashboard();
