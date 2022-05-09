import serializeForm from '../lib/serializeForm.js';

const createLobbyForm = document.getElementById('create-lobby-form');
const nameError = document.getElementById('name-error');
const passwordError = document.getElementById('password-error');

function validateSerializedData(data) {
  const validName = data.lobbyName.length >= 1 && data.lobbyName.length <= 128 && 
    !(data.lobbyName.length > 0 && data.lobbyName.replaceAll(/\s/g, '').length === 0);
  const validPassword = data.password.length > 0 ? 
    !(/\s/.test(data.password)) && data.password.length <= 32 : true;
  const validCapacity = data.maxPlayers >= 2 && data.maxPlayers <= 10;
  return validName && validPassword && validCapacity;
}

// Handle create lobby submission
createLobbyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const serializedData = serializeForm(createLobbyForm);

  if (validateSerializedData(serializedData)) {
    fetch('/api/lobbies/', {
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
        console.log(data);
      }
    })
    .catch((err) => {
      console.error(err);
    });
  }
});

// Input validation
document.getElementById('lobby-name-input').addEventListener('input', (event) => {
  const value = event.target.value;

  if (value.length > 0 && value.replaceAll(/\s/g, '').length === 0) {
    nameError.innerHTML = 'Lobby name cannot be purely whitespace';
    nameError.className = 'error-message';
  } else if (value.length > 128) {
    nameError.innerHTML = 'Lobby name cannot exceed 128 characters';
    nameError.className = 'error-message';
  } else if (value.length <= 0) {
    nameError.innerHTML = 'Lobby name cannot be empty';
    nameError.className = 'error-message';
  } else {
    nameError.className = 'hidden';
  }
})

document.getElementById('lobby-password-input').addEventListener('input', (event) => {
  const value = event.target.value;

  if (/\s/.test(value)) {
    passwordError.innerHTML = 'Password cannot contain whitespace';
    passwordError.className = 'error-message';
  } else if (value.length > 32) {
    passwordError.innerHTML = 'Password cannot exceed 32 characters';
    passwordError.className = 'error-message';
  } else {
    passwordError.className = 'hidden';
  }
})