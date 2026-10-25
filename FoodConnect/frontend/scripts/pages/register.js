/* ==========================================================
   FoodConnect - Register page (register.html)
   ========================================================== */

// Account types shown in the Register form for each kind of user
const TYPES = {
  donor: ['Individual', 'Hotel', 'Restaurant', 'Caterer', 'Event organiser'],
  recipient: ['NGO', 'Orphanage', 'Old-age home', 'Ashrama', 'Shelter', 'Community kitchen', 'Charity']
};

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

fillTypes();                              // fill the Register type list
