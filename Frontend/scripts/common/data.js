
/*
 * FoodConnect - API Communication
 * Connects the frontend to the PHP backend.
 * No hardcoded demo users or food listings.
 */

const API_BASE = '../../backend/api';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (HTTP ${response.status}).`
    );
  }

  return result;
}

// Fetch available food listings.
async function getFoodListings() {
  return apiRequest('listings.php');
}

// Fetch the currently authenticated user.
async function getCurrentUser() {
  return apiRequest('current-user.php');
}

// Create a new food listing.
async function createFoodListing(listing) {
  return apiRequest('listings.php', {
    method: 'POST',
    body: JSON.stringify(listing)
  });
}

// Submit a request for a food listing.
async function createFoodRequest(foodId) {
  return apiRequest('requests.php', {
    method: 'POST',
    body: JSON.stringify({ food_id: foodId })
  });
}

// Fetch the current user's dashboard.
async function getDashboard() {
  return apiRequest('dashboard.php');
}

// Fetch community impact statistics.
async function getFoodConnectStats() {
  return apiRequest('stats.php');
}

// Fetch Hall of Fame contributors.
async function getHallOfFame() {
  return apiRequest('fame.php');
}

// Log out the current user.
async function logoutUser() {
  return apiRequest('logout.php', {
    method: 'POST',
    body: JSON.stringify({})
  });
}
