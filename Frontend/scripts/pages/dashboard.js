/*
 * FoodConnect - Dashboard
 * Donors can view donation statistics, add food listings, and download a certificate.
 * Organisations can browse available food.
 */

const dashboardBody = $("#dashBody");
const knownIncomingRequestIds = new Set();
let incomingRequestPollingStarted = false;

async function loadDashboard() {
  if (!dashboardBody) return;

  dashboardBody.textContent = "Loading your dashboard...";

  try {
    const result = await apiRequest("dashboard.php");
    const user = result.user || {};
    const role = user.role || "";

    dashboardBody.replaceChildren();

    const heading = document.createElement("h1");
    heading.textContent = `Welcome, ${user.name || "User"}!`;
    dashboardBody.appendChild(heading);

    const description = document.createElement("p");
    description.className = "lead";
    description.textContent = `Account type: ${role}`;
    dashboardBody.appendChild(description);

    if (role === "donor") {
      const donations = getDonorDonationData(result);
      const suppliedStats = result.stats || result.statistics || {};
      renderDonorStatistics(donations, suppliedStats, user);
      renderDonorForm();
      renderDonorCertificate(user.name || "FoodConnect Donor");
      const incomingRequests = getIncomingRequests(result);
      renderIncomingRequestPopup(incomingRequests);
      startIncomingRequestPolling();
    } else if (role === "organisation") {
      renderOrganisationDashboard();
    } else {
      const message = document.createElement("p");
      message.textContent =
        "Your account does not have a supported dashboard role.";
      dashboardBody.appendChild(message);
    }
  } catch (error) {
    dashboardBody.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = "Dashboard unavailable";

    const message = document.createElement("p");
    message.textContent = error.message || "Please log in and try again.";

    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.textContent = "Go to Login";
    loginLink.className = "btn";

    dashboardBody.append(heading, message, loginLink);
  }
}

/*
 * Use donation/listing data if dashboard.php already returns it.
 * The current frontend only guarantees result.user, so do not call a
 * made-up endpoint or pretend statistics exist when the API has not supplied them.
 */
function getDonorDonationData(result) {
  const possibleArrays = [
    result.donations,
    result.listings,
    result.foodListings,
    result.food_listings,
    result.user && result.user.donations,
    result.user && result.user.listings,
  ];

  return possibleArrays.find(Array.isArray) || [];
}

function normaliseStatus(item) {
  return String(
    item.status || item.state || item.listing_status || item.collection_status || ""
  ).trim().toLowerCase();
}

function getIncomingRequests(result) {
  const candidates = [
    result.incomingRequests,
    result.incoming_requests,
    result.pendingRequests,
    result.pending_requests,
    result.requests,
  ];
  const requests = candidates.find(Array.isArray) || [];
  return requests.filter((request) => {
    const status = String(request.status || request.request_status || "pending").toLowerCase();
    return status === "pending" || status === "requested";
  });
}

function renderDonorStatistics(donations, suppliedStats, user = {}) {
  const section = document.createElement("section");
  section.className = "card dash-panel donor-statistics";

  const heading = document.createElement("h2");
  heading.textContent = "Your Donation Statistics";

  const totalFromApi = Number(
    suppliedStats.totalDonations ?? suppliedStats.total_donations ?? suppliedStats.total ??
    user.totalDonations ?? user.total_donations
  );
  const total = Number.isFinite(totalFromApi) && totalFromApi >= 0
    ? totalFromApi
    : donations.length;

  const rankValue = suppliedStats.donorRank ?? suppliedStats.donor_rank ??
    suppliedStats.rank ?? user.donorRank ?? user.donor_rank ?? user.rank;
  const rank = rankValue === undefined || rankValue === null || String(rankValue).trim() === ""
    ? "Not ranked yet"
    : (typeof rankValue === "number" || /^#?\d+$/.test(String(rankValue).trim())
        ? `#${String(rankValue).replace(/^#/, "")}`
        : String(rankValue));

  const tableWrap = document.createElement("div");
  tableWrap.className = "dashboard-table-wrap";

  const table = document.createElement("table");
  table.className = "donation-stats-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Donation statistic", "Value"].forEach((labelText) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = labelText;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  [["Total donations", String(total)], ["Donor rank", rank]].forEach(([labelText, value]) => {
    const row = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.textContent = labelText;
    const valueCell = document.createElement("td");
    valueCell.className = "donation-stat-count";
    valueCell.textContent = value;
    if (labelText === "Total donations") valueCell.dataset.totalDonations = "true";
    if (labelText === "Donor rank") valueCell.dataset.donorRank = "true";
    row.append(labelCell, valueCell);
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  tableWrap.appendChild(table);
  section.append(heading, tableWrap);

  if (rank === "Not ranked yet") {
    const note = document.createElement("p");
    note.className = "stats-note";
    note.textContent = "Your rank will appear when donor ranking data is provided by the dashboard API.";
    section.appendChild(note);
  }
  dashboardBody.appendChild(section);
}

function getRequestKey(request) {
  return String(request.request_id ?? request.requestId ?? request.id ?? request.id_request ??
    request.listing_id ?? request.listingId ?? request.food_id ?? "");
}

function startIncomingRequestPolling() {
  if (incomingRequestPollingStarted) return;
  incomingRequestPollingStarted = true;

  // Check for new requests while the donor leaves the dashboard open.
  window.setInterval(async () => {
    try {
      const result = await apiRequest("dashboard.php");
      const requests = getIncomingRequests(result);
      const newRequests = requests.filter((request) => {
        const key = getRequestKey(request);
        return key && !knownIncomingRequestIds.has(key);
      });
      if (newRequests.length) renderIncomingRequestPopup(newRequests);

      const stats = result.stats || result.statistics || {};
      const total = stats.totalDonations ?? stats.total_donations ?? stats.total ??
        (result.user && (result.user.totalDonations ?? result.user.total_donations));
      const totalCell = dashboardBody.querySelector("[data-total-donations='true']");
      if (totalCell && total !== undefined && total !== null && Number.isFinite(Number(total))) {
        totalCell.textContent = String(Number(total));
      }
      const rank = stats.donorRank ?? stats.donor_rank ?? stats.rank ??
        (result.user && (result.user.donorRank ?? result.user.donor_rank ?? result.user.rank));
      const rankCell = dashboardBody.querySelector("[data-donor-rank='true']");
      if (rankCell && rank !== undefined && rank !== null && String(rank).trim() !== "") {
        rankCell.textContent = (typeof rank === "number" || /^#?\d+$/.test(String(rank).trim()))
          ? `#${String(rank).replace(/^#/, "")}` : String(rank);
      }
    } catch (_) {
      // Keep the dashboard usable if a background refresh temporarily fails.
    }
  }, 30000);
}

function renderIncomingRequestPopup(requests) {
  if (!requests.length) return;
  requests.forEach((request) => {
    const key = getRequestKey(request);
    if (key) knownIncomingRequestIds.add(key);
  });

  const overlay = document.createElement("div");
  overlay.className = "request-confirm-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "incomingRequestTitle");

  const dialog = document.createElement("section");
  dialog.className = "request-confirm-dialog";

  const heading = document.createElement("h2");
  heading.id = "incomingRequestTitle";
  heading.textContent = "New food request";

  const intro = document.createElement("p");
  intro.textContent = "An organisation has requested your food donation. Please confirm or reject the request.";
  dialog.append(heading, intro);

  const statusMessage = document.createElement("p");
  statusMessage.className = "request-action-message";
  statusMessage.setAttribute("role", "status");
  statusMessage.setAttribute("aria-live", "polite");

  requests.forEach((request) => {
    const card = document.createElement("article");
    card.className = "incoming-request-card";

    const foodName = document.createElement("h3");
    foodName.textContent = request.food_name || request.title || request.listing_title || request.foodTitle || "Food donation";

    const org = document.createElement("p");
    org.textContent = `Organisation: ${request.organisation_name || request.organization_name || request.org_name || request.requester_name || request.user_name || "Organisation"}`;

    const quantity = request.qty || request.quantity || request.servings;
    const quantityText = document.createElement("p");
    quantityText.textContent = quantity ? `Quantity: ${quantity}` : "";
    card.append(foodName, org);
    if (quantity) card.appendChild(quantityText);

    const actions = document.createElement("div");
    actions.className = "request-action-buttons";

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "btn dk";
    confirmButton.textContent = "Confirm donation";

    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.className = "btn request-reject-button";
    rejectButton.textContent = "Reject";

    const requestId = request.request_id ?? request.requestId ?? request.id ?? request.id_request;
    const listingId = request.listing_id ?? request.listingId ?? request.food_id;

    async function respondToRequest(action, button) {
      if (requestId === undefined && listingId === undefined) {
        statusMessage.textContent = "This request has no ID. Please update the dashboard API to include request_id.";
        return;
      }
      confirmButton.disabled = true;
      rejectButton.disabled = true;
      statusMessage.textContent = action === "confirm" ? "Confirming donation…" : "Rejecting request…";
      try {
        const response = await apiRequest("requests.php", {
          method: "POST",
          body: JSON.stringify({
            action,
            request_id: requestId,
            listing_id: listingId,
          }),
        });
        statusMessage.textContent = response.message || (action === "confirm" ? "Donation confirmed." : "Request rejected.");
        card.remove();

        // Count only confirmed donations, never listings that were merely published.
        if (action === "confirm") {
          const totalCell = dashboardBody.querySelector("[data-total-donations='true']");
          if (totalCell) {
            const current = Number.parseInt(totalCell.textContent, 10);
            if (Number.isFinite(current)) totalCell.textContent = String(current + 1);
          }
        }
        if (!dialog.querySelector(".incoming-request-card")) {
          const closeButton = document.createElement("button");
          closeButton.type = "button";
          closeButton.className = "btn dk";
          closeButton.textContent = "Done";
          closeButton.addEventListener("click", () => overlay.remove());
          dialog.appendChild(closeButton);
        }
      } catch (error) {
        statusMessage.textContent = error.message || "Could not update this request. Please try again.";
        confirmButton.disabled = false;
        rejectButton.disabled = false;
      }
    }

    confirmButton.addEventListener("click", () => respondToRequest("confirm", confirmButton));
    rejectButton.addEventListener("click", () => respondToRequest("reject", rejectButton));
    actions.append(confirmButton, rejectButton);
    card.appendChild(actions);
    dialog.appendChild(card);
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "request-popup-close";
  closeButton.textContent = "Close for now";
  closeButton.addEventListener("click", () => overlay.remove());

  dialog.append(statusMessage, closeButton);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  closeButton.focus();
}

function renderDonorCertificate(donorName) {
  const section = document.createElement("section");
  section.className = "card certificate-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Your Certificate of Appreciation";

  const description = document.createElement("p");
  description.textContent =
    "Celebrate your commitment to sharing good food and reducing waste.";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn dk";
  button.textContent = "Download Certificate";
  button.addEventListener("click", () => {
    const certificateWindow = window.open("", "_blank", "width=900,height=680");
    if (!certificateWindow) {
      description.textContent =
        "Please allow pop-ups for this site to download your certificate.";
      return;
    }

    const logoUrl = new URL("../assets/images/logo.png", window.location.href).href;
    const safeName = typeof esc === "function"
      ? esc(donorName)
      : String(donorName).replace(/[&<>"']/g, (char) => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        }[char]));
    const issueDate = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());

    certificateWindow.document.write(`<!DOCTYPE html>
      <html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FoodConnect Certificate</title>
      <style>
        *{box-sizing:border-box}body{margin:0;padding:20px;background:#f3f6f1;color:#183b31;font-family:Arial,sans-serif}
        .certificate{max-width:760px;margin:auto;padding:26px 30px;text-align:center;background:#fffdf7;border:7px double #c9973d;outline:1px solid #16473a;outline-offset:-17px}
        img{width:64px;height:64px;object-fit:contain}.brand{margin:5px 0 12px;color:#16473a;font-size:16px;font-weight:bold;letter-spacing:2px;text-transform:uppercase}
        h1{margin:8px 0;color:#16473a;font-family:Georgia,serif;font-size:38px}.rule{width:100px;height:3px;margin:12px auto;background:#d4a84c}
        .intro{margin:16px 0 8px;color:#5d6b66;font-size:16px}.name{margin:8px 0;color:#9b6d1b;font-family:Georgia,serif;font-size:32px}
        .copy{max-width:620px;margin:0 auto;color:#344b43;font-size:16px;line-height:1.5}.date{margin:20px 0 0;color:#5d6b66;font-size:13px}
        @media print{@page{size:landscape;margin:10mm}body{padding:0;background:#fff}.certificate{max-width:none;padding:24px 28px}}
      </style></head><body><main class="certificate"><img src="${logoUrl}" alt="FoodConnect logo">
      <div class="brand">FoodConnect</div><h1>Certificate of Appreciation</h1><div class="rule"></div>
      <p class="intro">Presented with gratitude to</p><h2 class="name">${safeName}</h2>
      <p class="copy">For being part of the FoodConnect community and helping good food reach people who need it. Your generosity makes a meaningful difference.</p>
      <p class="date">Issued ${issueDate}</p></main><script>window.onload=()=>window.print()<\/script></body></html>`);
    certificateWindow.document.close();
  });

  section.append(heading, description, button);
  dashboardBody.appendChild(section);
}

function renderDonorForm() {
  const section = document.createElement("section");
  section.className = "card dash-panel add-food-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Add Food Listing";

  const description = document.createElement("p");
  description.textContent = "Share surplus food with people who need it.";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "btn dk";
  toggleButton.textContent = "＋ Add Food Listing";
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-controls", "addFoodFormPanel");

  const formPanel = document.createElement("div");
  formPanel.id = "addFoodFormPanel";
  formPanel.className = "add-food-form-panel";
  formPanel.hidden = true;

  const form = document.createElement("form");
  form.id = "addFoodForm";

  const fields = [
    { name: "title", label: "Food name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "kind", label: "Food category", type: "select", required: true },
    { name: "qty", label: "Quantity / servings", type: "text", required: true },
    { name: "addr", label: "Pickup address", type: "text", required: true },
    {
      name: "collect_before",
      label: "Collect before",
      type: "datetime-local",
      required: true,
    },
  ];

  fields.forEach((field) => {
    const label = document.createElement("label");
    label.className = "food-form-label";
    label.textContent = field.label;

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
    } else if (field.type === "select") {
      input = document.createElement("select");

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select food category";
      placeholder.disabled = true;
      placeholder.selected = true;
      input.appendChild(placeholder);

      [
        { value: "veg", label: "Veg" },
        { value: "non-veg", label: "Non-Veg" },
      ].forEach((optionData) => {
        const option = document.createElement("option");
        option.value = optionData.value;
        option.textContent = optionData.label;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type;
    }

    input.name = field.name;
    input.required = Boolean(field.required);
    input.className = "food-form-control";
    input.id = `food-${field.name}`;

    if (field.name === "collect_before") {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      input.min = now.toISOString().slice(0, 16);
    }

    label.htmlFor = input.id;
    label.appendChild(input);
    form.appendChild(label);
  });

  const message = document.createElement("p");
  message.id = "addFoodMessage";
  message.className = "form-status-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");

  const buttonRow = document.createElement("div");
  buttonRow.className = "food-form-actions";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "btn dk";
  submitButton.textContent = "Publish Food Listing";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "btn food-form-cancel";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    form.reset();
    message.textContent = "";
    formPanel.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.textContent = "＋ Add Food Listing";
    toggleButton.focus();
  });

  buttonRow.append(submitButton, cancelButton);
  form.append(buttonRow, message);
  formPanel.appendChild(form);

  toggleButton.addEventListener("click", () => {
    const willOpen = formPanel.hidden;
    formPanel.hidden = !willOpen;
    toggleButton.setAttribute("aria-expanded", String(willOpen));
    toggleButton.textContent = willOpen ? "− Close Food Listing Form" : "＋ Add Food Listing";
    if (willOpen) {
      form.querySelector("input[name='title']").focus();
    }
  });

  section.append(heading, description, toggleButton, formPanel);
  dashboardBody.appendChild(section);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const deadline = new Date(data.collect_before);

    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      message.textContent = "Please select a future collection date and time.";
      return;
    }

    submitButton.disabled = true;
    message.textContent = "Publishing food listing...";

    try {
      const response = await apiRequest("listings.php", {
        method: "POST",
        body: JSON.stringify(data),
      });

      message.textContent =
        response.message || "Food listing published successfully!";
      form.reset();

    } catch (error) {
      message.textContent =
        error.message || "Could not publish the food listing.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

function renderOrganisationDashboard() {
  const section = document.createElement("section");
  section.className = "card";

  const heading = document.createElement("h2");
  heading.textContent = "Find Available Food";

  const description = document.createElement("p");
  description.textContent =
    "Browse food available for collection and submit a request.";

  const link = document.createElement("a");
  link.href = "listings.html";
  link.className = "btn dk";
  link.textContent = "Browse Food Listings";

  section.append(heading, description, link);
  dashboardBody.appendChild(section);
}

document.addEventListener("DOMContentLoaded", loadDashboard);
