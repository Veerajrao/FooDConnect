/*
 * FoodConnect - Login Page
 * Sends login credentials to the PHP backend.
 * Redirects users according to their authenticated role.
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

    if (!value) {
      setLoginFieldError(input, "Enter your email address.");
      return false;
    }

    if (!input.validity.valid) {
      setLoginFieldError(input, "Enter a valid email address.");
      return false;
    }
  }

  if (input?.id === "lPass" && !input.value) {
    setLoginFieldError(input, "Enter your password.");
    return false;
  }

  setLoginFieldError(input, "");
  return true;
}

if (loginForm) {
  const emailInput = $("#lEmail");
  const passwordInput = $("#lPass");

  const loginFields = [
    emailInput,
    passwordInput
  ].filter(Boolean);

  loginFields.forEach((input) => {
    input.addEventListener("input", () => {
      validateLoginField(input);

      if (loginMessage) {
        loginMessage.style.display = "none";
      }
    });

    input.addEventListener("blur", () => {
      validateLoginField(input);
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedRole = document.querySelector(
      'input[name="lrole"]:checked'
    );

    const invalidField = loginFields.find(
      (input) => !validateLoginField(input)
    );

    if (invalidField) {
      invalidField.focus();
      return;
    }

    if (!emailInput || !passwordInput) {
      return;
    }

    if (!selectedRole) {
      if (loginMessage) {
        msg(
          loginMessage,
          "Please select your account type.",
          true
        );
      }
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    // Normalize the selected role.
    let role = selectedRole.value.trim().toLowerCase();

    if (["recipient", "organization"].includes(role)) {
      role = "organisation";
    }

    const submitButton = loginForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const result = await apiRequest("login.php", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          role
        })
      });

      if (!result?.success || !result?.user?.role) {
        throw new Error(
          result?.message || "Unable to verify your account."
        );
      }

      if (loginMessage) {
        loginMessage.style.display = "none";
      }

      // Use the role authenticated by the PHP backend.
      const authenticatedRole = String(
        result.user.role
      ).trim().toLowerCase();

      if (authenticatedRole === "admin") {
        window.location.replace("admin.html");
        return;
      }

      if (
        authenticatedRole === "donor" ||
        authenticatedRole === "organisation"
      ) {
        window.location.replace("dashboard.html");
        return;
      }

      throw new Error("Unrecognised account type.");

    } catch (error) {
      if (loginMessage) {
        msg(
          loginMessage,
          error.message ||
            "Login failed. Please check your details.",
          true
        );
      } else {
        console.error("FoodConnect login error:", error);
      }

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}
