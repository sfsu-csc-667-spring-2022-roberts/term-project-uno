import serializeForm from '../lib/serializeForm.js';

const changeUsernameForm = document.getElementById('changeUsername');
const changePasswordForm = document.getElementById('changePassword');

function validateUsernameForm(data) {
  return /^[a-z0-9]+$/i.test(data.username) && data.username.length <= 16;
}

function validatePasswordForm(data) {
  return data.newPassword.length >= 4 && data.newPassword.length <= 32 &&
  data.newPassword === data.confirmNewPassword;
}

/*
 Handle Picture submission here!
 should be PUT request at /api/users/avatar
*/

// Handle change username submission
changeUsernameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const feedback = document.getElementById('username-change-feedback');
  const serializedData = serializeForm(changeUsernameForm);

  feedback.innerHTML = '';
  feedback.className = 'hidden';

  if (validateUsernameForm(serializedData)) {
    const url = window.location.protocol + '//' + window.location.host;
    fetch(url + '/api/users/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializedData)
    })
    .then(async (res) => {
      if (res.status === 204) {
        feedback.innerHTML = 'Successfully changed username';
        feedback.className = 'success-message';
      } else {
        try {
          const data = await res.json();
          feedback.innerHTML = data.message;
        } catch (e) {
          feedback.innerHTML = `An error occured: ${res.status}`; 
        } finally {
          feedback.className = 'error-message';
        }
      }
    })
    .catch((err) => {
      console.error(err);
    })
  }
})

// Handle change password submission
changePasswordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const feedback = document.getElementById('change-password-feedback');
  const serializedData = serializeForm(changePasswordForm);

  if (validatePasswordForm(serializedData)) {
    const url = window.location.protocol + '//' + window.location.host;
    fetch(url + '/api/users/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializedData)
    })
    .then(async (res) => {
      if (res.status === 204) {
        feedback.innerHTML = 'Successfully changed password';
        feedback.className = 'success-message';
      } else {
        try {
          const data = await res.json();
          feedback.innerHTML = data.message;
        } catch (e) {
          feedback.innerHTML = `An error occured: ${res.status}`; 
        } finally {
          feedback.className = 'error-message';
        }
      }
    })
    .catch((err) => {
      console.error(err);
    })
  }
})

// Input validation
document.getElementById('username').addEventListener('input', (event) => {
  const nameError = document.getElementById('name-error');
  const value = event.target.value;
  
  if(value.length === 0) {
    nameError.className = 'hidden';
  } else if (!/^[a-z0-9]+$/i.test(value)) {
    nameError.innerHTML = 'Username must be alphanumeric'
    nameError.className = 'error-message';
  } else if (value.length > 16) {
    nameError.innerHTML = 'Username must be at most 16 characters long';
    nameError.className = 'error-message';
  } else {
    nameError.className = 'hidden';
  }
});

document.getElementById('newPassword').addEventListener('input', (event) => {
  const newPasswordError = document.getElementById('new-password-error');
  const confirmPasswordError = document.getElementById('confirm-password-error');
  const value = event.target.value;

  if (value.length === 0) {
    newPasswordError.className = 'hidden';
  } else if (value.length < 4 || value.length > 32) {
    newPasswordError.innerHTML = 'Password must be between 4 and 32 characters long';
    newPasswordError.className = 'error-message';
  } else {
    newPasswordError.className = 'hidden';
  }

  if (value != document.getElementById('confirmNewPassword').value) {
    confirmPasswordError.innerHTML = 'Password and confirm password must match';
    confirmPasswordError.className = 'error-message';
  } else {
    confirmPasswordError.className = 'hidden';
  }
});

document.getElementById('confirmNewPassword').addEventListener('input', (event) => {
  const confirmPasswordError = document.getElementById('confirm-password-error');
  const value = event.target.value;

  if (value != document.getElementById('newPassword').value) {
    confirmPasswordError.innerHTML = 'Password and confirm password must match';
    confirmPasswordError.className = 'error-message';
  } else {
    confirmPasswordError.className = 'hidden';
  }
});