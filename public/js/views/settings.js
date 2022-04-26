import serializeForm from '../lib/serializeForm.js';

const changeUsernameForm = document.getElementById('changeUsername');
const changePasswordForm = document.getElementById('changePassword');
const pictureFileUpload = document.getElementById('fileUpload');
const changePictureForm = document.getElementById('changePicture');
const profilePictureSrc = document.getElementById('profileImage').src;

function validateUsernameForm(data) {
  return /^[a-z0-9]+$/i.test(data.username) && data.username.length <= 16;
}

function validatePasswordForm(data) {
  return data.newPassword.length >= 4 && data.newPassword.length <= 32 &&
  data.newPassword === data.confirmNewPassword;
}

function informUsernameSuccess() {
  const feedback = document.getElementById('username-change-feedback');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  usernameInput.setAttribute('placeholder', usernameInput.value);
  feedback.innerHTML = 'Successfully changed username';
  feedback.className = 'success-message';
  usernameInput.value = '';
  passwordInput.value = '';
}

function informUsernameUnexpectedError() {
  const feedback = document.getElementById('username-change-feedback');
  const passwordInput = document.getElementById('password');
  feedback.innerHTML = 'An unexpected error occured. Try again later.';
  feedback.className = 'error-message';
  passwordInput.value = '';
}

async function informUsernameError(res) {
  const feedback = document.getElementById('username-change-feedback');
  const passwordInput = document.getElementById('password');
  try {
    const data = await res.json();
    feedback.innerHTML = data.message;
  } catch (e) {
    feedback.innerHTML = `An error occured: ${res.status}`; 
  } finally {
    feedback.className = 'error-message';
    passwordInput.value = '';
  }
}

function informPasswordSuccess() {
  const feedback = document.getElementById('change-password-feedback');
  const oldPassword = document.getElementById('oldPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmNewPassword = document.getElementById('confirmNewPassword');
  feedback.innerHTML = 'Successfully changed password';
  feedback.className = 'success-message';
  oldPassword.value = '';
  newPassword.value = '';
  confirmNewPassword.value = '';
}

function informPasswordUnexpecterError() {
  const feedback = document.getElementById('change-password-feedback');
  const oldPassword = document.getElementById('oldPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmNewPassword = document.getElementById('confirmNewPassword');
  feedback.innerHTML = 'An unexpected error occured. Try again later.';
  feedback.className = 'error-message';
  oldPassword.value = '';
  newPassword.value = '';
  confirmNewPassword.value = '';
}

async function informPasswordError(res) {
  const feedback = document.getElementById('change-password-feedback');
  const oldPassword = document.getElementById('oldPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmNewPassword = document.getElementById('confirmNewPassword');
  try {
    const data = await res.json();
    feedback.innerHTML = data.message;
  } catch (e) {
    feedback.innerHTML = `An error occured: ${res.status}`; 
  } finally {
    feedback.className = 'error-message';
    oldPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
  }
}

/*
 Handle Picture submission here!
 should be PUT request at /api/users/avatar
*/
pictureFileUpload.addEventListener('change', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const profileImage = document.getElementById('profileImage');
  const editOptions = document.getElementById('editOptions');
  const fileUploadLabel = document.getElementById('upload-pic');
  const fileInfo = pictureFileUpload.files[0];
  editOptions.style = "display:block";
  fileUploadLabel.style = "display:none";
  profileImage.src = URL.createObjectURL(fileInfo);
})

changePictureForm.addEventListener('reset' , (event) => {
  event.preventDefault();
  event.stopPropagation();

  const editOptions = document.getElementById('editOptions');
  const fileUploadLabel = document.getElementById('upload-pic');
  const profileImage = document.getElementById('profileImage');
  editOptions.style = "display:none";
  fileUploadLabel.style = "display:block";
  profileImage.src = profilePictureSrc;
  
})

changePictureForm.addEventListener('submit' , (event) => {
  event.preventDefault();
  event.stopPropagation();

  const fileInfo = pictureFileUpload.files[0];

  let formData = new FormData();
  formData.append('file', fileInfo);

  const url = window.location.protocol + '//' + window.location.host;
  fetch(url + '/api/users/upload/', {
    method: 'POST',
    body: formData,
  })
  .then(async (res) => {
    const data = await res.json();
    await fetch(url + '/api/users/avatar/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({key: data}),
    })
    .then(async (res) => {
      if(res) {
        const editOptions = document.getElementById('editOptions');
        const fileUploadLabel = document.getElementById('upload-pic');
        editOptions.style = "display:none";
        fileUploadLabel.style = "display:block";
      }
    })
    .catch((err) => {
      console.error(err);
    })
  })
  .catch((err) => {
    console.error(err);
  })
})


// Handle change username submission
changeUsernameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const serializedData = serializeForm(changeUsernameForm);

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
      if (res.status === 204) informUsernameSuccess();
      else await informUsernameError(res);
    })
    .catch((err) => {
      console.error(err);
      informUsernameUnexpectedError();
    })
  }
})

// Handle change password submission
changePasswordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

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
      if (res.status === 204) informPasswordSuccess();
      else await informPasswordError(res);
    })
    .catch((err) => {
      console.error(err);
      informPasswordUnexpecterError();
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