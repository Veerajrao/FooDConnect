/*
 * FoodConnect - Login Page
 * Sends login credentials to the PHP backend.
 */

const loginForm = $("#loginForm");
const loginMessage = $("#aMsg");

function setLoginFieldError(input, message) {
  if (!input) return;

  const errorId = `${input.id}Error`;
  let error = document.getElementById(errorId);

  if (!message) {
    error?.remove();
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    return;
  }

  if (!error) {
    error = document.createElement("small");
    error.className = "field-error";
    error.id = errorId;
    error.setAttribute("aria-live", "polite");
    input.after(error);
  }

  error.textContent = message;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", errorId);
}

function validateLoginField(input) {
  if (input?.id === "lEmail") {
    const value = input.value.trim();
    if (!value)
      return (setLoginFieldError(input, "Enter your email address."), false);
    if (!input.validity.valid)
      return (setLoginFieldError(input, "Enter a valid email address."), false);
  }

  if (input?.id === "lPass" && !input.value) {
    return (setLoginFieldError(input, "Enter your password."), false);
  }

  setLoginFieldError(input, "");
  return true;
}

if (loginForm) {
  const emailInput = $("#lEmail");
  const passwordInput = $("#lPass");
  const loginFields = [emailInput, passwordInput].filter(Boolean);

  loginFields.forEach((input) => {
    input.addEventListener("input", () => {
      validateLoginField(input);
      if (loginMessage) loginMessage.style.display = "none";
    });
    input.addEventListener("blur", () => validateLoginField(input));
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedRole = document.querySelector('input[name="lrole"]:checked');

    const invalidField = loginFields.find(
      (input) => !validateLoginField(input),
    );
    if (invalidField) {
      invalidField.focus();
      return;
    }

    if (!emailInput || !passwordInput || !selectedRole) return;

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const role = selectedRole.value;

    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    try {
      const result = await apiRequest("login.php", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      if (loginMessage) {
        loginMessage.style.display = "none";
      }

      // Successful authentication: open the dashboard.
      window.location.href = "dashboard.html";
    } catch (error) {
      if (loginMessage) {
        msg(
          loginMessage,
          error.message || "Login failed. Please check your details.",
          true,
        );
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
