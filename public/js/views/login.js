import serializeForm from '../lib/serializeForm.js';

const loginForm = document.getElementById('loginForm');

function validateSerializedData(data) {
  const error = document.getElementById('error');

  if (!/^[a-z0-9]+$/i.test(data.username) || data.username.length > 16 ||
    data.password.length < 4 || data.password.length > 32) {
    error.innerHTML = 'Invalid username and/or password';
    error.className = 'error-message';
    return false;
  }
  error.className = 'hidden';
  return true;
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const serializedData = serializeForm(loginForm);
  if(validateSerializedData(serializedData)){
    fetch('/api/users/login', {
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
        if (res.status === 400) {
          const error = document.getElementById('error');
          error.innerHTML = data.message;
          error.className = 'error-message';
        } else console.log(data);
      }
    })
    .catch((err) => {
      console.error(err);
    });
  } 
});

const url = window.location.protocol + '//' + window.location.host;
fetch(url + '/lobbies/2')
.then((res) => {
  console.log(res.status);
})
.catch((err) => {
  console.error(err);
});