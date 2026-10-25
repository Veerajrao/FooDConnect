/* ==========================================================
   FoodConnect - welcome login popup (loaded on every page)
   Needs helpers.js, data.js and navigation.js loaded first.
   ========================================================== */

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
};

// Close with Esc or by clicking the dark area outside the box
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#welcome').hidden) closeWelcome(); });
$('#welcome').addEventListener('click', e => { if (e.target.id === 'welcome') closeWelcome(); });

let seen = false;
try { seen = sessionStorage.getItem('fc_welcome_seen') === '1'; } catch (e) {}
if (!me && !seen) setTimeout(openWelcome, 500);
