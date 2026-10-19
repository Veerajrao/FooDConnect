
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

    // Check required fields
    if (
      !name ||
      !email ||
      !phone ||
      !city ||
      !password ||
      !confirmPassword ||
      !selectedRole
    ) {
      if (registerMessage) {
        msg(registerMessage, 'Please fill in all required fields.', true);
      }
      return;
    }

    // Check password length
    if (password.length < 8) {
      if (registerMessage) {
        msg(
          registerMessage,
          'Password must be at least 8 characters.',
          true
        );
      }
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      if (registerMessage) {
        msg(registerMessage, 'Passwords do not match.', true);
      }
      return;
    }

    // Check terms acceptance
    if (!termsAccepted) {
      if (registerMessage) {
        msg(
          registerMessage,
          'Please accept the terms to continue.',
          true
        );
      }
      return;
    }

    const submitButton = registerForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const role = selectedRole.value === 'recipient'
        ? 'organisation'
        : selectedRole.value;

      const result = await apiRequest('register.php', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          city,
          registration_number: registrationNumber || null,
          password,
          role,
          account_type: accountType || null
        })
      });

      if (registerMessage) {
        msg(
          registerMessage,
          result.message || 'Registration successful! You can now log in.',
          false
        );
      }

      registerForm.reset();
      updateRegistrationFields();

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
      if (submitButton) {
        submitButton.disabled = false;
      }
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

  const requiresRegistration = [
    'hotel',
    'restaurant',
    'caterer',
    'organisation',
    'organization'
  ].includes(selectedType);

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
