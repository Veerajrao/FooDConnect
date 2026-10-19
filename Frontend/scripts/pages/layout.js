
/*
 * FoodConnect - Logout
 * Requests session termination from the PHP backend.
 */

async function logout() {
  try {
    await apiRequest('logout.php', {
      method: 'POST',
      body: JSON.stringify({})
    });

    // Return to the login page after the server ends the session.
    window.location.href = 'login.html';
  } catch (error) {
    alert(
      error.message ||
      'Unable to log out. Please try again.'
    );
  }
}

// Allow logout buttons to use onclick="logout()".
window.logout = logout;
