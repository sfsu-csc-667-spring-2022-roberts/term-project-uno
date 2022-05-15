import serializeForm from '../lib/serializeForm.js';

const popup = document.getElementById('popup-container');
const nameInput = document.getElementById('lobby-name-input');
const maxPlayersLabel = document.getElementById('num-players-output');
const maxPlayersInput = document.getElementById('maxPlayers');
const cancelPopup = document.getElementById('cancel-popup');
const updateLobbyBtn = document.getElementById('update-lobby-button');
const lobbySettingsForm = document.getElementById('lobby-settings-form');
const passwordCheckbox = document.getElementById('password-checkbox');
const passwordInput = document.getElementById('lobby-password-input');
const feedback = document.getElementById('feedback');
const nameError = document.getElementById('name-error');
const passwordError = document.getElementById('password-error');

function validateSerializedData(data) {
  let validPassword = true;
  if (!passwordCheckbox.checked) {
    validPassword = data.password.length > 0 ? 
      !(/\s/.test(data.password)) && data.password.length <= 32 : true;
  }
  const validName = data.lobbyName.length >= 1 && data.lobbyName.length <= 128 && 
    !(data.lobbyName.length > 0 && data.lobbyName.replaceAll(/\s/g, '').length === 0);
  const validCapacity = data.maxPlayers >= 2 && data.maxPlayers <= 10;
  return validName && validPassword && validCapacity;
}

if (cancelPopup) {
  cancelPopup.addEventListener('click', (event) => {
    if (event.target != cancelPopup) return;
    event.preventDefault();
    event.stopPropagation();

    popup.className = 'hidden';
    nameInput.value = lobbyName;
    passwordInput.value = '';
    passwordInput.disabled = isPrivate;
    passwordCheckbox.checked = isPrivate;
    maxPlayersInput.value = maxPlayers;
    maxPlayersLabel.innerHTML = maxPlayers;
    nameError.className = 'error-hidden';
    passwordError.className = 'error-hidden';
    feedback.className = 'hidden';
    feedback.innerHTML = '';
  })
}

if (passwordCheckbox) {
  passwordCheckbox.addEventListener('input', (event) => {
    const checked = event.target.checked;
    passwordInput.disabled = checked;
    if (checked) passwordInput.value = '';
  })
}

if (updateLobbyBtn) {
  updateLobbyBtn.addEventListener('click', (event) => {
    if (event.target != updateLobbyBtn) return;
    event.preventDefault();
    event.stopPropagation();

    const serializedData = serializeForm(lobbySettingsForm);
    serializedData.updatePassword = !passwordCheckbox.checked;
    
    if (validateSerializedData(serializedData)) {
      fetch(`/api/lobbies/${lobbyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serializedData)
      })
      .then(async (res) => {
        const data = await res.json();
        feedback.innerHTML = data.message;
        if (res.status == 200) {
          feedback.className = 'success-message';
        } else {
          feedback.className = 'error-message';
        }
      })
      .catch((err) => {
        console.error(err);
      });
    }
  });
}

if (nameInput) {
  nameInput.addEventListener('input', (event) => {
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
      nameError.className = 'error-hidden';
    }
  });
}

if (passwordInput) {
  passwordInput.addEventListener('input', (event) => {
    const value = event.target.value;
  
    if (/\s/.test(value)) {
      passwordError.innerHTML = 'Password cannot contain whitespace';
      passwordError.className = 'error-message';
    } else if (value.length > 32) {
      passwordError.innerHTML = 'Password cannot exceed 32 characters';
      passwordError.className = 'error-message';
    } else {
      passwordError.className = 'error-hidden';
    }
  })
}