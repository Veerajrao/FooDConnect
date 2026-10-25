/* ==========================================================
   FoodConnect - shared data (loaded on every page)
   Demo data, saving, meal totals and recognition tiers.
   Needs helpers.js loaded first.
   ========================================================== */

// App data kept in memory: all users, food listings and requests,
// and the logged-in user (me).
let users, foods, reqs;
let me = DB.get('me', null);

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

// START-UP (runs on every page): load or create the data, then restore the saved login
seed();
if (me) me = users.find(u => u.id === me) || null;
