/* ==========================================================
   FoodConnect - Available food page (listings.html)
   ========================================================== */

// AVAILABLE FOOD: cards for every listing that is still available
function renderListings() {
  const available = foods.filter(f => f.status === 'Available');

  $('#listGrid').innerHTML = available.map(f => {
    const donor = uid(f.donor);
    const t = tier(meals(donor));
    return `
      <div class="card">
        <span class="tag">${esc(f.kind)}</span><span class="tag amb">Serves ${f.qty}</span>
        <h3>${esc(f.title)}</h3>
        <p>By <b>${esc(donor.name)}</b> <span class="badge t-${t}" style="font-size:.75rem">${t}</span></p>
        <p>📍 ${esc(f.addr)}</p>
        <p>⏰ Collect before: ${esc(f.by)}</p>
        <p style="margin-top:12px"><button class="btn dk sm" onclick="requestFood(${f.id})">Request this food</button></p>
      </div>`;
  }).join('') || '<div class="card"><p>No food is listed right now. Please check back soon.</p></div>';
}

// An organisation asks for a food listing. Checks login, role and duplicate requests first.
function requestFood(id) {
  const box = $('#lmsg');
  if (!me) {
    msg(box, 'Please log in as a recipient organisation to request food.', 1);
    go('login');
    return;
  }
  if (me.role !== 'recipient') {
    msg(box, 'Only recipient organisations can request food.', 1);
    return;
  }
  if (reqs.some(r => r.food === id && r.org === me.id)) {
    msg(box, 'You already requested this food.', 1);
    return;
  }
  reqs.push({ id: Date.now(), food: id, org: me.id, status: 'Pending' });
  save();
  msg(box, 'Request sent. The donor will approve or reject it.');
}

renderListings();
