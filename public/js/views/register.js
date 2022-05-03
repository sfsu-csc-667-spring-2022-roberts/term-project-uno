import serializeForm from '../lib/serializeForm.js';

const registerForm = document.getElementById('registerForm');

function validateSerializedData(data) {
  return /^[a-z0-9]+$/i.test(data.username) && data.username.length <= 16 &&
    data.password.length >= 4 && data.password.length <= 32 &&
    data.password === data.confirmPassword && !(/\s/.test(data.password));
}

// Handle registration submission
registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const error = document.getElementById('error');
  const serializedData = serializeForm(registerForm);

  error.innerHTML = ''
  error.className = 'hidden';

  if (validateSerializedData(serializedData)) {
    fetch('/api/users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializedData)
    })
    .then(async (res) => {
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const data = await res.json();
        if (res.status === 409) {
          const nameError = document.getElementById('name-error');
          nameError.innerHTML = data.message;
          nameError.className = 'error-message';
        } else if (res.status === 400) {
          error.innerHTML = `Please make sure that your username 
            and/or password are valid OR use a different username`;
          error.className = 'error-message';
        }
      }
    })
    .catch((err) => {
      console.error(err);
    });
  }
});

// Input validation

document.getElementById('username').addEventListener('input', (event) => {
  const nameError = document.getElementById('name-error');
  const value = event.target.value;
  
  if (!/^[a-z0-9]+$/i.test(value)) {
    nameError.innerHTML = 'Username must be alphanumeric'
    nameError.className = 'error-message';
  } else if (value.length > 16) {
    nameError.innerHTML = 'Username must be at most 16 characters long';
    nameError.className = 'error-message';
  } else {
    nameError.className = 'hidden';
  }
});

document.getElementById('password').addEventListener('input', (event) => {
  const passwordError = document.getElementById('password-error');
  const confirmError = document.getElementById('confirm-password-error');
  const value = event.target.value;

  if (value.length < 4 || value.length > 32) {
    passwordError.innerHTML = 'Password must be between 4 and 32 characters long';
    passwordError.className = 'error-message';
  } else if (/\s/.test(value)) {
    passwordError.innerHTML = 'Password cannot contain whitespace';
    passwordError.className = 'error-message';
  } else {
    passwordError.className = 'hidden';
  }

  if (value != document.getElementById('confirmPassword').value) {
    confirmError.innerHTML = 'Password and confirm password must match';
    confirmError.className = 'error-message';
  } else {
    confirmError.className = 'hidden';
  }
});

document.getElementById('confirmPassword').addEventListener('input', (event) => {
  const confirmError = document.getElementById('confirm-password-error');
  const value = event.target.value;

  if (value != document.getElementById('password').value) {
    confirmError.innerHTML = 'Password and confirm password must match';
    confirmError.className = 'error-message';
  } else {
    confirmError.className = 'hidden';
  }
});
