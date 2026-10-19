
/*
 * FoodConnect - Hall of Fame
 * Loads contributor information from the PHP backend.
 */

const fameList = $('#fameList');

async function loadHallOfFame() {
  if (!fameList) return;

  fameList.textContent = 'Loading Hall of Fame...';

  try {
    const result = await apiRequest('fame.php');
    const contributors = Array.isArray(result)
      ? result
      : result.contributors || [];

    fameList.replaceChildren();

    if (contributors.length === 0) {
      fameList.textContent =
        'No contributors to display yet.';
      return;
    }

    contributors.forEach((person, index) => {
      const card = document.createElement('article');
      card.className = 'fame';

      const rank = document.createElement('div');
      rank.className = 'rk';
      rank.textContent = String(index + 1);

      const details = document.createElement('div');
      details.className = 'fr';

      const name = document.createElement('h3');
      name.className = 'nm';
      name.textContent = person.name || 'Community Member';

      const contribution = document.createElement('p');
      contribution.textContent =
        person.contribution || 'Food redistribution';

      const points = document.createElement('p');
      points.textContent =
        `${Number(person.points) || 0} points`;

      details.append(name, contribution);
      card.append(rank, details, points);
      fameList.appendChild(card);
    });
  } catch (error) {
    fameList.textContent =
      error.message || 'Unable to load Hall of Fame.';
  }
}

document.addEventListener('DOMContentLoaded', loadHallOfFame);
