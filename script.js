/* ==========================================================
   FoodConnect - application script
   Order: helpers > data > navigation > public pages >
          login/register > dashboards > start-up
   ========================================================== */


/* ---------- 1. HELPERS AND SETTINGS ---------- */

// Short name for document.querySelector, e.g. $('#home')
const $ = s => document.querySelector(s);

// Account types shown in the Register form for each kind of user
const TYPES = {
  donor: ['Individual', 'Hotel', 'Restaurant', 'Caterer', 'Event organiser'],
  recipient: ['NGO', 'Orphanage', 'Old-age home', 'Ashrama', 'Shelter', 'Community kitchen', 'Charity']
};

// Small storage wrapper: saves and reads data in the browser (localStorage).
// Everything is wrapped in try/catch so the site still works if storage is blocked.
const DB = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem('fc_' + key)) || fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('fc_' + key, JSON.stringify(value));
    } catch (e) {}
  }
};

// App data kept in memory: all users, food listings and requests,
// the logged-in user (me) and the admin's current dashboard tab.
let users, foods, reqs;
let me = DB.get('me', null);
let adminTab = 'Overview';

// Makes user-typed text safe to show inside HTML (prevents script injection)
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

// Finds a user by id (used to show a donor's or organisation's name)
const uid = id => users.find(u => u.id === id) || { name: 'Unknown' };

// Shows a green success message, or a red error message when err is true
function msg(el, text, err) {
  el.textContent = text;
  el.className = 'msg' + (err ? ' err' : '');
  el.style.display = 'block';
}


/* ---------- 2. DATA: DEMO DATA, SAVING AND RECOGNITION ---------- */

// Loads saved data. On the very first visit it creates demo accounts and listings.
// "base" is the number of meals a demo donor has already shared.
function seed() {
  users = DB.get('users', null);
  if (!users) {
    users = [
      { id: 1, role: 'admin', type: 'Admin', name: 'FoodConnect Admin', email: 'admin@foodconnect.org', pass: 'admin123', city: '-', ok: true },
      { id: 2, role: 'donor', type: 'Hotel', name: 'Demo Grand Hotel', email: 'donor@demo.com', pass: 'donor123', city: 'Udupi', ok: true, base: 1240 },
      { id: 3, role: 'recipient', type: 'NGO', name: 'Annapurna Seva Trust', email: 'ngo@demo.com', pass: 'ngo123', city: 'Udupi', ok: true },
      { id: 4, role: 'donor', type: 'Caterer', name: 'Sri Lakshmi Caterers', email: 'a@x.com', pass: 'x', city: 'Mangaluru', ok: true, base: 3350 },
      { id: 5, role: 'donor', type: 'Restaurant', name: 'Coastal Kitchen', email: 'b@x.com', pass: 'x', city: 'Manipal', ok: true, base: 560 },
      { id: 6, role: 'donor', type: 'Individual', name: 'Ramesh and Family', email: 'c@x.com', pass: 'x', city: 'Udupi', ok: true, base: 130 },
      { id: 7, role: 'donor', type: 'Event organiser', name: 'Festa Events', email: 'd@x.com', pass: 'x', city: 'Karkala', ok: true, base: 270 }
    ];
    foods = [
      { id: 1, donor: 2, title: 'Veg biryani and raita', kind: 'Veg', qty: 60, addr: 'Demo Grand Hotel, Main Rd, Udupi', by: 'Today, 9:30 pm', status: 'Available' },
      { id: 2, donor: 4, title: 'Chapati, dal and mixed veg', kind: 'Veg', qty: 120, addr: 'Sri Lakshmi Hall, Mangaluru', by: 'Today, 8:00 pm', status: 'Available' }
    ];
    reqs = [];
    save();
  } else {
    foods = DB.get('foods', []);
    reqs = DB.get('reqs', []);
  }
}

// Writes users, foods and requests to browser storage
function save() {
  DB.set('users', users);
  DB.set('foods', foods);
  DB.set('reqs', reqs);
}

// Total meals a donor has shared: starting number + servings of completed donations
function meals(u) {
  return (u.base || 0) + foods
    .filter(f => f.donor === u.id && f.status === 'Completed')
    .reduce((sum, f) => sum + f.qty, 0);
}

// Recognition tier for a meal count (shown as badges, in the Hall of Fame and on certificates)
function tier(n) {
  if (n >= 3000) return 'Platinum';
  if (n >= 1000) return 'Gold';
  if (n >= 200) return 'Silver';
  if (n >= 1) return 'Bronze';
  return 'New';
}


/* ---------- 3. NAVIGATION ---------- */

// Pages that exist. 'login' and 'register' share one section (the switch-tab page).
const PAGES = ['home', 'domains', 'guide', 'fame', 'listings', 'login', 'register', 'dash'];

// Go to a page by changing the URL hash, e.g. go('home') -> #home
function go(page) {
  location.hash = page;
}

// Runs every time the hash changes: shows the right page,
// updates the menu and fills the page with fresh data.
function route() {
  let p = location.hash.slice(1) || 'home';
  if (!PAGES.includes(p)) p = 'home';
  if (p === 'dash' && !me) p = 'login';          // dashboard needs a login

  const section = (p === 'login' || p === 'register') ? 'auth' : p;
  if (section === 'auth') showTab(p);

  document.querySelectorAll('.pg').forEach(s => s.classList.toggle('show', s.id === section));
  renderNav(p);

  // Pages that show live data are redrawn each time they open
  const renderers = { home: renderStats, fame: renderFame, listings: renderListings, dash: renderDash };
  if (renderers[p]) renderers[p]();
  window.scrollTo(0, 0);
  toggleMenu(false);                              // close the mobile side menu after navigating
}

// Opens/closes the mobile side menu. Pass true/false to force a state.
function toggleMenu(open) {
  const on = typeof open === 'boolean' ? open : !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', on);
  const b = document.getElementById('burger');
  if (b) { b.setAttribute('aria-expanded', on); b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 800) toggleMenu(false); });

// Builds the top menu. Logged-out users see Log in / Join; logged-in users see Dashboard / Log out.
function renderNav(p) {
  const links = [
    ['home', 'Home'],
    ['domains', 'Who can join'],
    ['guide', 'Guide'],
    ['fame', 'Hall of Fame'],
    ['listings', 'Available food']
  ];
  let html = links.map(([k, v]) => `<a href="#${k}" class="${p === k ? 'on' : ''}">${v}</a>`).join('');
  html += me
    ? `<a href="#dash" class="cta">My dashboard</a><button onclick="logout()">Log out</button>`
    : `<a href="#login">Log in</a><a href="#register" class="cta">Join</a>`;
  $('#nav').innerHTML = html;
}

// Ends the session and returns to the home page
function logout() {
  me = null;
  DB.set('me', null);
  go('home');
  route();
}


/* ---------- 4. PUBLIC PAGES ---------- */

// HOME: fills the impact numbers
function renderStats() {
  const done = foods.filter(f => f.status === 'Completed');
  const total = users.filter(u => u.role === 'donor').reduce((sum, u) => sum + meals(u), 0);
  $('#sMeals').textContent = total.toLocaleString();
  $('#sDon').textContent = done.length + users.filter(u => u.base).length * 3;
  $('#sDonors').textContent = users.filter(u => u.role === 'donor').length;
  $('#sOrgs').textContent = users.filter(u => u.role === 'recipient' && u.ok).length;
}

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
    location.hash = 'login';
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


/* ---------- 5. LOGIN AND REGISTER (one page, two tabs) ---------- */

// Heading and text for the green side panel of each tab
const SIDE = {
  login: ['Welcome back', 'Log in to post food, manage requests and see your impact.'],
  register: ['Join FoodConnect', 'Create a free account. It takes a minute, and your first donation or request can follow right away.']
};

// Switches between the Log in and Register forms
function showTab(t) {
  $('#loginForm').style.display = t === 'login' ? 'grid' : 'none';
  $('#regForm').style.display = t === 'register' ? 'grid' : 'none';
  $('#tabLogin').classList.toggle('on', t === 'login');
  $('#tabReg').classList.toggle('on', t === 'register');
  $('#tabLogin').setAttribute('aria-selected', t === 'login');
  $('#tabReg').setAttribute('aria-selected', t === 'register');
  $('#asTitle').textContent = SIDE[t][0];
  $('#asText').textContent = SIDE[t][1];
  $('#aMsg').style.display = 'none';
}

// Which role is selected in the Register form (donor or recipient)
const rrole = () => document.querySelector('input[name=rrole]:checked').value;

// Updates the Register form for the chosen role: type list, label text,
// and the extra registration-number field for organisations.
function fillTypes() {
  const r = rrole();
  $('#rType').innerHTML = TYPES[r].map(t => `<option>${t}</option>`).join('');
  $('#rNameLbl').textContent = r === 'donor' ? 'Full name or business name' : 'Organisation name';
  $('#rRegWrap').style.display = r === 'recipient' ? 'grid' : 'none';
  $('#rNote').style.display = r === 'recipient' ? 'block' : 'none';
  $('#rReg').required = r === 'recipient';
}
document.querySelectorAll('input[name=rrole]').forEach(i => i.onchange = fillTypes);

// Demo logins used by the three "Try a demo account" buttons
const DEMO = {
  donor: ['donor@demo.com', 'donor123'],
  recipient: ['ngo@demo.com', 'ngo123'],
  admin: ['admin@foodconnect.org', 'admin123']
};

// Fills the login form with a demo account
function demo(role) {
  document.querySelector(`input[name=lrole][value=${role}]`).checked = true;
  $('#lEmail').value = DEMO[role][0];
  $('#lPass').value = DEMO[role][1];
}

// REGISTER: checks passwords and duplicate email, creates the account and opens the dashboard.
// Donors are verified immediately; organisations wait for admin verification.
$('#regForm').onsubmit = e => {
  e.preventDefault();
  const box = $('#aMsg');
  const email = $('#rEmail').value.trim().toLowerCase();

  if ($('#rPass').value !== $('#rPass2').value) {
    return msg(box, 'The two passwords do not match. Please retype them.', 1);
  }
  if (users.some(u => u.email === email)) {
    return msg(box, 'This email is already registered. Please log in instead.', 1);
  }

  const role = rrole();
  const user = {
    id: Date.now(),
    role,
    type: $('#rType').value,
    name: $('#rName').value.trim(),
    email,
    phone: $('#rPhone').value.trim(),
    regNo: $('#rReg').value.trim(),
    pass: $('#rPass').value,
    city: $('#rCity').value.trim(),
    ok: role === 'donor'
  };
  users.push(user);
  save();
  me = user;
  DB.set('me', user.id);
  e.target.reset();
  fillTypes();
  go('dash');
};

// LOGIN: finds the account by email and password, then checks the chosen role matches
$('#loginForm').onsubmit = e => {
  e.preventDefault();
  const box = $('#aMsg');
  const role = document.querySelector('input[name=lrole]:checked').value;
  const user = users.find(x =>
    x.email === $('#lEmail').value.trim().toLowerCase() && x.pass === $('#lPass').value);

  if (!user) {
    return msg(box, 'Email or password is incorrect. Check both and try again.', 1);
  }
  if (user.role !== role) {
    return msg(box, `This account is not a ${role === 'recipient' ? 'recipient organisation' : role} account. Choose the right role above.`, 1);
  }
  me = user;
  DB.set('me', user.id);
  e.target.reset();
  go('dash');
};


/* ---------- 6. DASHBOARDS ---------- */

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
    <p style="margin:16px 0"><a class="btn dk" href="#listings">Browse available food</a></p>

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


/* ---------- 7. START-UP ---------- */

seed();                                   // load or create data
fillTypes();                              // fill the Register type list
if (me) me = users.find(u => u.id === me) || null;   // restore the saved login
window.addEventListener('hashchange', route);        // react to menu clicks
route();                                  // show the first page


/* ---------- 8. WELCOME LOGIN POPUP ---------- */

// Shows the login popup when the site opens, unless the user is logged in
// or already chose "Maybe later" during this browser session.
function closeWelcome() {
  $('#welcome').hidden = true;
  document.body.classList.remove('modal-open');
  try { sessionStorage.setItem('fc_welcome_seen', '1'); } catch (e) {}
}

function openWelcome() {
  $('#welcome').hidden = false;
  document.body.classList.add('modal-open');
  $('#wEmail').focus();
}

$('#wForm').onsubmit = e => {
  e.preventDefault();
  const box = $('#wMsg');
  const role = document.querySelector('input[name=wrole]:checked').value;
  const user = users.find(x =>
    x.email === $('#wEmail').value.trim().toLowerCase() && x.pass === $('#wPass').value);
  if (!user) return msg(box, 'Email or password is incorrect. Check both and try again.', 1);
  if (user.role !== role) {
    return msg(box, `This account is not a ${role === 'recipient' ? 'recipient organisation' : role} account. Choose the right role above.`, 1);
  }
  me = user;
  DB.set('me', user.id);
  e.target.reset();
  closeWelcome();
  go('dash');
  route();
};

// Close with Esc or by clicking the dark area outside the box
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#welcome').hidden) closeWelcome(); });
$('#welcome').addEventListener('click', e => { if (e.target.id === 'welcome') closeWelcome(); });

let seen = false;
try { seen = sessionStorage.getItem('fc_welcome_seen') === '1'; } catch (e) {}
if (!me && !seen) setTimeout(openWelcome, 500);
