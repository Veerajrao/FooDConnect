/* ==========================================================
   FoodConnect - Login page (login.html)
   ========================================================== */

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
