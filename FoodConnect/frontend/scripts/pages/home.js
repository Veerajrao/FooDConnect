/* ==========================================================
   FoodConnect - Home page (home.html)
   ========================================================== */

// HOME: fills the impact numbers
function renderStats() {
  const done = foods.filter(f => f.status === 'Completed');
  const total = users.filter(u => u.role === 'donor').reduce((sum, u) => sum + meals(u), 0);
  $('#sMeals').textContent = total.toLocaleString();
  $('#sDon').textContent = done.length + users.filter(u => u.base).length * 3;
  $('#sDonors').textContent = users.filter(u => u.role === 'donor').length;
  $('#sOrgs').textContent = users.filter(u => u.role === 'recipient' && u.ok).length;
}

renderStats();
