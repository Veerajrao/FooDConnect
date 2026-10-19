
/*
 * FoodConnect - Registration Page
 * Sends registration details to the PHP backend.
 */

const registerForm = $('#regForm');
const registerMessage = $('#rNote');

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = $('#rName')?.value.trim();
    const email = $('#rEmail')?.value.trim().toLowerCase();
    const phone = $('#rPhone')?.value.trim();
    const city = $('#rCity')?.value.trim();
    const registrationNumber = $('#rReg')?.value.trim();
    const password = $('#rPass')?.value;
    const confirmPassword = $('#rPass2')?.value;
    const selectedRole = document.querySelector(
      'input[name="rrole"]:checked'
    );
    const accountType = $('#rType')?.value;
    const termsAccepted = $('#rTerms')?.checked;

    if (!name || !email || !phone || !city || !password ||
        !confirmPassword || !selectedRole) {
      if (registerMessage) {
        msg(registerMessage, 'Please fill in all required fields.', true);
      }
      return;
    }

    if (password !== confirmPassword) {
      if (registerMessage) {
        msg(registerMessage, 'Passwords do not match.', true);
      }
      return;
    }

    if (!termsAccepted) {
      if (registerMessage) {
        msg(registerMessage, 'Please accept the terms to continue.', true);
      }
      return;
    }

    const submitButton = registerForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      await apiRequest('register.php', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          city,
          registration_number: registrationNumber || null,
          password,
          role: selectedRole.value,
          account_type: accountType || null
        })
      });

      if (registerMessage) {
        msg(
          registerMessage,
          'Registration successful! You can now log in.',
          false
        );
      }

      registerForm.reset();

      // Navigate to the login page after successful registration.
      window.setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (error) {
      if (registerMessage) {
        msg(
          registerMessage,
          error.message || 'Registration failed. Please try again.',
          true
        );
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

/*
 * Show or hide the registration-number field based on account type.
 */
function updateRegistrationFields() {
  const accountType = $('#rType');
  const registrationWrap = $('#rRegWrap');

  if (!accountType || !registrationWrap) return;

  const selectedType = accountType.value.toLowerCase();
  const requiresRegistration =
    selectedType === 'hotel' ||
    selectedType === 'restaurant' ||
    selectedType === 'caterer' ||
    selectedType === 'organization';

  registrationWrap.hidden = !requiresRegistration;
}

const accountTypeSelect = $('#rType');

if (accountTypeSelect) {
  accountTypeSelect.addEventListener(
    'change',
    updateRegistrationFields
  );

  updateRegistrationFields();
}
