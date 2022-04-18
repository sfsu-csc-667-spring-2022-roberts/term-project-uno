import serializeForm from '../lib/serializeForm.js';

const createLobbyForm = document.getElementById('createLobbyForm');

const privateCheckBox = document.getElementById('private-checkbox');

if (privateCheckBox) {
  privateCheckBox.addEventListener('click', (event) => {
    if(privateCheckBox.checked == true) {
      const passwordInput = document.createElement('input');
      passwordInput.id = 'password-input';
      passwordInput.name = "password";
      passwordInput.class = 'password-input';
      passwordInput.placeholder = "Password";
      passwordInput.required = true;
      
      document.getElementById('private-container').appendChild(passwordInput);
    } else {
      document.getElementById('private-container').removeChild(document.getElementById("password-input"));
    }
  });
}

createLobbyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const serializedData = serializeForm(createLobbyForm);
  const url = window.location.protocol + '//' + window.location.host;

  fetch(url + '/api/lobbies/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serializedData)
  })
  .then(async (res) => {
    if (res.redirected) {
      window.location.href = res.url;
    }
  })
  .catch((err) => {
    console.error(err);
  });
});