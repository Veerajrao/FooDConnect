/* ==========================================================
   FoodConnect - Hall of Fame page (fame.html)
   ========================================================== */

// HALL OF FAME: donors ranked by meals shared, each with a tier badge
function renderFame() {
  const ranked = users
    .filter(u => u.role === 'donor')
    .map(u => ({ u, n: meals(u) }))
    .sort((a, b) => b.n - a.n);

  $('#fameList').innerHTML = ranked.map((x, i) => `
    <div class="fr">
      <div class="rk">${i + 1}</div>
      <div class="nm"><b>${esc(x.u.name)}</b><small>${esc(x.u.type)}, ${esc(x.u.city)}</small></div>
      <div><b>${x.n.toLocaleString()}</b> meals</div>
      <span class="badge t-${tier(x.n)}">${tier(x.n) === 'New' ? 'New donor' : tier(x.n)}</span>
    </div>`).join('') || '<p>No donors yet. Be the first.</p>';
}

renderFame();
