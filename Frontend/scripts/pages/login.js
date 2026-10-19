
/*
 * FoodConnect - Login Page
 * Sends login credentials to the PHP backend.
 */

const loginForm = $('#loginForm');
const loginMessage = $('#aMsg');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const emailInput = $('#lEmail');
    const passwordInput = $('#lPass');
    const selectedRole = document.querySelector(
      'input[name="lrole"]:checked'
    );

    if (!emailInput || !passwordInput || !selectedRole) {
      if (loginMessage) {
        msg(loginMessage, 'Please complete all required fields.', true);
      }
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const role = selectedRole.value;

    if (!email || !password) {
      if (loginMessage) {
        msg(loginMessage, 'Enter your email and password.', true);
      }
      return;
    }

    const submitButton = loginForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      const result = await apiRequest('login.php', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          role
        })
      });

      if (loginMessage) {
        loginMessage.style.display = 'none';
      }

      // Successful authentication: open the dashboard.
      window.location.href = 'dashboard.html';
    } catch (error) {
      if (loginMessage) {
        msg(
          loginMessage,
          error.message || 'Login failed. Please check your details.',
          true
        );
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

/*
 * Optional demo button handler.
 * It only selects a role; it does not insert demo credentials.
 */
function demo(role) {
  const roleInput = document.querySelector(
    `input[name="lrole"][value="${role}"]`
  );

  if (roleInput) {
    roleInput.checked = true;
  }

  const emailInput = $('#lEmail');

  if (emailInput) {
    emailInput.focus();
  }
}
