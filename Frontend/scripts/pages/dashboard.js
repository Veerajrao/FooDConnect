
/*
 * FoodConnect - Dashboard
 * Donor can add food listings.
 * Organisation can view available food and request it.
 */

const dashboardBody = $('#dashBody');

async function loadDashboard() {
  if (!dashboardBody) return;

  dashboardBody.textContent = 'Loading your dashboard...';

  try {
    const result = await apiRequest('dashboard.php');
    const user = result.user || {};
    const role = user.role || '';

    dashboardBody.replaceChildren();

    const heading = document.createElement('h1');
    heading.textContent = `Welcome, ${user.name || 'User'}!`;
    dashboardBody.appendChild(heading);

    const description = document.createElement('p');
    description.textContent = `Account type: ${role}`;
    dashboardBody.appendChild(description);

    if (role === 'donor') {
      renderDonorForm();
    } else if (role === 'organisation') {
      renderOrganisationDashboard();
    } else {
      const message = document.createElement('p');
      message.textContent = 'Your account does not have a supported dashboard role.';
      dashboardBody.appendChild(message);
    }
  } catch (error) {
    dashboardBody.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = 'Dashboard unavailable';

    const message = document.createElement('p');
    message.textContent =
      error.message || 'Please log in and try again.';

    const loginLink = document.createElement('a');
    loginLink.href = 'login.html';
    loginLink.textContent = 'Go to Login';
    loginLink.className = 'btn';

    dashboardBody.append(heading, message, loginLink);
  }
}

function renderDonorForm() {
  const section = document.createElement('section');
  section.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = 'Add Food Listing';

  const form = document.createElement('form');
  form.id = 'addFoodForm';

  const fields = [
    { name: 'title', label: 'Food name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'kind', label: 'Food category', type: 'text' },
    { name: 'qty', label: 'Quantity / servings', type: 'text', required: true },
    { name: 'addr', label: 'Pickup address', type: 'text', required: true },
    { name: 'collect_before', label: 'Collect before', type: 'datetime-local', required: true }
  ];

  fields.forEach((field) => {
    const label = document.createElement('label');
    label.textContent = field.label;
    label.style.display = 'block';
    label.style.marginBottom = '12px';

    const input = document.createElement(
      field.type === 'textarea' ? 'textarea' : 'input'
    );

    if (field.type !== 'textarea') {
      input.type = field.type;
    }

    input.name = field.name;
    input.required = Boolean(field.required);
    input.style.display = 'block';
    input.style.width = '100%';
    input.style.marginTop = '6px';
    input.style.padding = '10px';

    if (field.name === 'collect_before') {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      input.min = now.toISOString().slice(0, 16);
    }

    label.appendChild(input);
    form.appendChild(label);
  });

  const message = document.createElement('p');
  message.id = 'addFoodMessage';
  message.setAttribute('role', 'status');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'btn dk';
  button.textContent = 'Publish Food Listing';

  form.append(button, message);
  section.append(heading, form);
  dashboardBody.appendChild(section);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    const deadline = new Date(data.collect_before);

    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      message.textContent = 'Please select a future collection date and time.';
      return;
    }

    submitButton.disabled = true;
    message.textContent = 'Publishing food listing...';

    try {
      const response = await apiRequest('listings.php', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      message.textContent =
        response.message || 'Food listing published successfully!';

      form.reset();
    } catch (error) {
      message.textContent =
        error.message || 'Could not publish the food listing.';
    } finally {
      submitButton.disabled = false;
    }
  });
}

function renderOrganisationDashboard() {
  const section = document.createElement('section');
  section.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = 'Find Available Food';

  const description = document.createElement('p');
  description.textContent =
    'Browse food available for collection and submit a request.';

  const link = document.createElement('a');
  link.href = 'listings.html';
  link.className = 'btn dk';
  link.textContent = 'Browse Food Listings';

  section.append(heading, description, link);
  dashboardBody.appendChild(section);
}

document.addEventListener('DOMContentLoaded', loadDashboard);
