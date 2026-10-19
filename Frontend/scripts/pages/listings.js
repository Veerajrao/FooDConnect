
/*
 * FoodConnect - Available Food Listings
 * Loads food listings from the PHP backend.
 */

const listingsGrid = $('#listGrid');
const listingsMessage = $('#lmsg');

async function renderListings() {
  if (!listingsGrid) return;

  listingsGrid.replaceChildren();

  if (listingsMessage) {
    listingsMessage.textContent = 'Loading available food...';
    listingsMessage.style.display = 'block';
    listingsMessage.className = 'msg';
  }

  try {
    const result = await getFoodListings();
    const listings = Array.isArray(result)
      ? result
      : result.listings || [];

    if (listingsMessage) {
      listingsMessage.style.display = 'none';
    }

    if (listings.length === 0) {
      listingsGrid.innerHTML =
        '<div class="card"><p>No food is listed right now. Please check back soon.</p></div>';
      return;
    }

    listingsGrid.innerHTML = listings.map((food) => {
      const id = Number(food.id);
      const title = esc(food.title || food.food_name || 'Food listing');
      const kind = esc(food.kind || food.category || 'Food');
      const quantity = esc(food.qty ?? food.quantity ?? 'Not specified');
      const address = esc(food.addr || food.location || 'Not specified');
      const collectionTime = esc(
        food.by || food.collect_before || 'Not specified'
      );
      const donorName = esc(food.donor_name || 'FoodConnect donor');

      return `
        <article class="card">
          <span class="tag">${kind}</span>
          <span class="tag amb">Serves ${quantity}</span>
          <h3>${title}</h3>
          <p>By <b>${donorName}</b></p>
          <p>📍 ${address}</p>
          <p>⏰ Collect before: ${collectionTime}</p>
          <p style="margin-top:12px">
            <button
              class="btn dk sm"
              type="button"
              data-food-id="${Number.isSafeInteger(id) && id > 0 ? id : ''}"
              ${Number.isSafeInteger(id) && id > 0 ? '' : 'disabled'}>
              Request this food
            </button>
          </p>
        </article>
      `;
    }).join('');
  } catch (error) {
    if (listingsMessage) {
      listingsMessage.textContent =
        error.message || 'Unable to load food listings. Please try again.';
      listingsMessage.style.display = 'block';
      listingsMessage.className = 'msg err';
    }
  }
}

if (listingsGrid) {
  listingsGrid.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-food-id]');
    if (!button || button.disabled) return;

    const foodId = Number(button.dataset.foodId);

    if (!Number.isSafeInteger(foodId) || foodId <= 0) return;

    button.disabled = true;

    try {
      await apiRequest('requests.php', {
        method: 'POST',
        body: JSON.stringify({ food_id: foodId })
      });

      if (listingsMessage) {
        listingsMessage.textContent = 'Food request submitted successfully.';
        listingsMessage.style.display = 'block';
        listingsMessage.className = 'msg';
      }
    } catch (error) {
      if (listingsMessage) {
        listingsMessage.textContent =
          error.message || 'Unable to submit your request. Please log in and try again.';
        listingsMessage.style.display = 'block';
        listingsMessage.className = 'msg err';
      }
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', renderListings);
