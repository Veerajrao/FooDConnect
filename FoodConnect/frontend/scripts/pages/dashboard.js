/* ==========================================================
   FoodConnect - Dashboard page (dashboard.html)
   Donor, organisation and admin dashboards.
   ========================================================== */

// The admin's current dashboard tab
let adminTab = 'Overview';

// Shows the dashboard that matches the logged-in user's role
function renderDash() {
  const body = $('#dashBody');
  if (me.role === 'donor') body.innerHTML = donorView();
  else if (me.role === 'recipient') body.innerHTML = orgView();
  else body.innerHTML = adminView();
}

/* --- Donor dashboard --- */

// Meals shared, tier badge, certificate button, post-food form and a table of listings and requests
function donorView() {
  const mine = foods.filter(f => f.donor === me.id);
  const n = meals(me);
  const t = tier(n);
  const next = n < 200 ? 200 : n < 1000 ? 1000 : n < 3000 ? 3000 : null;   // meals needed for the next tier

  return `
    <h2>Welcome, ${esc(me.name)}</h2>
    <p class="lead">${esc(me.type)} donor account</p>

    <div class="grid" style="margin-bottom:26px">
      <div class="card">
        <h3>Meals shared</h3>
        <p style="font:800 2.2rem 'Bricolage Grotesque';color:var(--g2)">${n.toLocaleString()}</p>
        ${next ? `<p>${next - n} more to reach the next tier</p>` : '<p>You have reached the top tier. Thank you.</p>'}
      </div>
      <div class="card">
        <h3>Your recognition</h3>
        <p><span class="badge t-${t}">${t === 'New' ? 'New donor' : t + ' Giver'}</span></p>
        <p style="margin-top:10px">${t === 'New' ? 'Complete a donation to earn your first badge.' : '<button class="btn dk sm" onclick="certificate()">Download certificate</button>'}</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:26px">
      <h3>Post surplus food</h3>
      <div class="msg" id="pmsg"></div>
      <form onsubmit="postFood(event)">
        <label>Food item<input id="fT" placeholder="e.g. Veg pulao and curry" required></label>
        <label>Type<select id="fK"><option>Veg</option><option>Non-veg</option><option>Sweets and snacks</option><option>Packed food</option></select></label>
        <label>Servings<input type="number" id="fQ" min="1" required></label>
        <label>Pickup address<input id="fA" required></label>
        <label>Collect before<input id="fB" placeholder="e.g. Today, 9:00 pm" required></label>
        <button class="btn dk">Post food</button>
      </form>
    </div>

    <h3 style="margin-bottom:10px">Your listings and requests</h3>
    <div class="tw"><table>
      <tr><th>Food</th><th>Servings</th><th>Status</th><th>Requests</th></tr>
      ${mine.map(f => {
        const rs = reqs.filter(r => r.food === f.id);
        const requestList = rs.map(r => `${esc(uid(r.org).name)} (${r.status}) ` +
          (r.status === 'Pending'
            ? `<button class="btn sm" onclick="decide(${r.id},true)">Approve</button> <button class="btn red sm" onclick="decide(${r.id},false)">Reject</button>`
            : '')).join('<br>') || 'None yet';
        const collectBtn = f.status === 'Approved'
          ? `<br><button class="btn dk sm" onclick="collected(${f.id})">Mark as collected</button>` : '';
        return `<tr><td>${esc(f.title)}</td><td>${f.qty}</td><td>${f.status}</td><td>${requestList}${collectBtn}</td></tr>`;
      }).join('') || '<tr><td colspan="4">You have not posted any food yet.</td></tr>'}
    </table></div>`;
}

// Adds a new food listing from the donor's form
function postFood(e) {
  e.preventDefault();
  foods.push({
    id: Date.now(),
    donor: me.id,
    title: $('#fT').value.trim(),
    kind: $('#fK').value,
    qty: +$('#fQ').value,
    addr: $('#fA').value.trim(),
    by: $('#fB').value.trim(),
    status: 'Available'
  });
  save();
  renderDash();
  msg($('#pmsg'), 'Food posted. Organisations can now request it.');
}

// Donor approves or rejects a request. Approving one request rejects the other pending ones.
function decide(id, approve) {
  const r = reqs.find(x => x.id === id);
  const f = foods.find(x => x.id === r.food);
  if (approve) {
    r.status = 'Approved';
    f.status = 'Approved';
    reqs.forEach(o => {
      if (o.food === f.id && o.id !== id && o.status === 'Pending') o.status = 'Rejected';
    });
  } else {
    r.status = 'Rejected';
  }
  save();
  renderDash();
}

// Donor marks food as collected: the donation is completed and its servings count towards recognition
function collected(id) {
  foods.find(f => f.id === id).status = 'Completed';
  save();
  renderDash();
}

// Opens a printable Certificate of Appreciation for the donor
function certificate() {
  const n = meals(me);
  const w = window.open('', '_blank');
  if (!w) return alert('Please allow pop-ups to view the certificate.');
  w.document.write(`<title>Certificate</title>
    <body style="font-family:Georgia,serif;text-align:center;padding:50px">
      <div style="border:10px double #16473a;padding:50px">
        <p style="letter-spacing:3px">FOODCONNECT</p>
        <h1 style="font-size:2.6rem;color:#16473a">Certificate of Appreciation</h1>
        <p>This is proudly presented to</p>
        <h2 style="font-size:2.4rem">${esc(me.name)}</h2>
        <p>for sharing <b>${n.toLocaleString()} meals</b> with people in need<br>and earning the title of</p>
        <h2 style="color:#d49a0d">${tier(n)} Giver</h2>
        <p style="margin-top:40px">Reduce food waste. Increase social impact.<br>${new Date().toDateString()}</p>
      </div>
      <script>setTimeout(() => print(), 400)<\/script>
    </body>`);
  w.document.close();
}

/* --- Recipient organisation dashboard --- */

// Verification notice, link to listings and a table of the organisation's requests.
// The pickup address is shown only after the donor approves.
function orgView() {
  const mine = reqs.filter(r => r.org === me.id);

  return `
    <h2>Welcome, ${esc(me.name)}</h2>
    <p class="lead">${esc(me.type)} recipient account</p>
    ${me.ok ? '' : '<div class="hint">Your organisation is awaiting admin verification. You can still browse food.</div>'}
    <p style="margin:16px 0"><a class="btn dk" href="listings.html">Browse available food</a></p>

    <h3 style="margin-bottom:10px">Your requests</h3>
    <div class="tw"><table>
      <tr><th>Food</th><th>Donor</th><th>Pickup address</th><th>Status</th></tr>
      ${mine.map(r => {
        const f = foods.find(x => x.id === r.food) || {};
        const approved = r.status === 'Approved';
        const cls = r.status === 'Rejected' ? 'warn' : r.status === 'Pending' ? 'amb' : '';
        const label = f.status === 'Completed' && approved ? 'Collected' : r.status;
        return `<tr><td>${esc(f.title || '')}</td><td>${esc(uid(f.donor).name)}</td><td>${approved ? esc(f.addr) : 'Shown after approval'}</td><td><span class="tag ${cls}">${label}</span></td></tr>`;
      }).join('') || '<tr><td colspan="4">No requests yet. Browse the listings to get started.</td></tr>'}
    </table></div>`;
}

/* --- Admin dashboard --- */

// Three tabs: Overview (totals), Users (verify / remove) and Listings (remove)
function adminView() {
  const tabs = ['Overview', 'Users', 'Listings'];
  let body = '';

  if (adminTab === 'Overview') {
    body = `<div class="grid">
      <div class="card"><h3>Donors</h3><b>${users.filter(u => u.role === 'donor').length}</b></div>
      <div class="card"><h3>Organisations</h3><b>${users.filter(u => u.role === 'recipient').length}</b></div>
      <div class="card"><h3>Listings</h3><b>${foods.length}</b></div>
      <div class="card"><h3>Pending requests</h3><b>${reqs.filter(r => r.status === 'Pending').length}</b></div>
      <div class="card"><h3>Completed donations</h3><b>${foods.filter(f => f.status === 'Completed').length}</b></div>
    </div>`;
  }

  if (adminTab === 'Users') {
    body = `<div class="tw"><table>
      <tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th></th></tr>
      ${users.filter(u => u.role !== 'admin').map(u => `<tr>
        <td>${esc(u.name)}</td><td>${esc(u.type)}</td><td>${esc(u.email)}</td><td>${u.ok ? 'Verified' : 'Pending'}</td>
        <td>${u.ok ? '' : `<button class="btn sm" onclick="verify(${u.id})">Verify</button> `}<button class="btn red sm" onclick="delUser(${u.id})">Remove</button></td>
      </tr>`).join('')}
    </table></div>`;
  }

  if (adminTab === 'Listings') {
    body = `<div class="tw"><table>
      <tr><th>Food</th><th>Donor</th><th>Servings</th><th>Status</th><th></th></tr>
      ${foods.map(f => `<tr>
        <td>${esc(f.title)}</td><td>${esc(uid(f.donor).name)}</td><td>${f.qty}</td><td>${f.status}</td>
        <td><button class="btn red sm" onclick="delFood(${f.id})">Remove</button></td>
      </tr>`).join('') || '<tr><td colspan="5">No listings.</td></tr>'}
    </table></div>`;
  }

  return `
    <h2>Admin dashboard</h2>
    <p class="lead">Verify organisations and keep listings safe.</p>
    <div class="tabs">${tabs.map(t => `<button class="${t === adminTab ? 'on' : ''}" onclick="adminTab='${t}';renderDash()">${t}</button>`).join('')}</div>
    ${body}`;
}

// Admin: mark a user as verified
function verify(id) {
  users.find(u => u.id === id).ok = true;
  save();
  renderDash();
}

// Admin: remove a user after confirmation
function delUser(id) {
  if (confirm('Remove this user?')) {
    users = users.filter(u => u.id !== id);
    save();
    renderDash();
  }
}

// Admin: remove a food listing and any requests made for it
function delFood(id) {
  foods = foods.filter(f => f.id !== id);
  reqs = reqs.filter(r => r.food !== id);
  save();
  renderDash();
}

// START-UP: draw the dashboard (route() in navigation.js already sent logged-out visitors to login)
if (me) renderDash();
