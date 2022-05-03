const lobbyTitle = document.getElementById('lobby-title');
const lobbyTypeLogo = document.getElementById('lobby-type-icon');
const popupContainer = document.getElementById('popup-container');
const numPlayersLabel = document.getElementById('num-players-output');
const numPlayersInput = document.getElementById('maxPlayers');
const lobbyMenu = document.getElementById('lobby-menu');
const readyButton = document.getElementById('ready-button');
const settings = document.getElementById('settings');
const baseURL = `${window.location.protocol}//${window.location.host}`;

let leaveButton = document.getElementById('leave-button');
let startButton = document.getElementById('start-button');
let inviteInput = document.getElementById('username');
let inviteButton = document.getElementById('invite-button');

function addKickButtonListener() {
  const kickButtons = document.querySelectorAll('.kick')
  if (kickButtons) {
    for (let button of kickButtons) {
      button.addEventListener('click', (e) => {
        fetch(`/api/lobbies/${lobbyId}/users/${button.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .catch((err) => console.error(err));
      });
    }
  }
}

function createGuestRow(guest) {
  if (guest.empty) {
    return (
      `<tr class="lobby-guest">
        <td class="lobby-guest-icon-col"></td>
        <td class="lobby-guest-name"></td>
        <td class="lobby-guest-status"></td>
        <td></td>
      </tr>`
    );
  }
  else if (guest.unavailable) {
    return (
      `<tr class="lobby-unavailable">
        <td class="lobby-guest-icon-col"></td>
        <td class="lobby-guest-name"></td>
        <td class="lobby-guest-status"></td>
        <td></td>
      </tr>`
    );
  }
  return (
    `<tr class="lobby-guest${userId == guest.id ? ' current-user' : ''}">
      <td class="lobby-guest-icon-col">
        <div class="lobby-guest-icon">
        <img class="${guest.portrait ? 'lobby-avatar-portrait' : 'lobby-avatar-landscape'}" src="${guest.avatar ? guest.avatar : '/images/default-profile-pic.png'}" />
        </div>
      </td>
      <td class="lobby-guest-name">${guest.username}</td>
      <td class="lobby-guest-status">
        ${guest.host ? 'Host' : `${guest.ready ? 'Ready' : 'Not Ready'}`}
      </td>
      <td></td>
    </tr>`
  );
}

function createGuestRowAsHost(guest) {
  if (guest.empty) {
    return (
      `<tr class="lobby-guest">
        <td class="lobby-guest-icon-col"></td>
        <td class="lobby-guest-name"></td>
        <td class="lobby-guest-status"></td>
        <td></td>
      </tr>`
    );
  }
  else if (guest.unavailable) {
    return (
      `<tr class="lobby-unavailable">
        <td class="lobby-guest-icon-col"></td>
        <td class="lobby-guest-name"></td>
        <td class="lobby-guest-status"></td>
        <td></td>
      </tr>`
    );
  }
  return (
    `<tr class="lobby-guest${userId == guest.id ? ' current-user' : ''}">
      <td class="lobby-guest-icon-col">
        <div class="lobby-guest-icon">
        <img class="${guest.portrait ? 'lobby-avatar-portrait' : 'lobby-avatar-landscape'}" src="${guest.avatar ? guest.avatar : '/images/default-profile-pic.png'}" />
        </div>
      </td>
      <td class="lobby-guest-name">${guest.username}</td>
      <td class="lobby-guest-status">
        ${guest.host ? 'Host' : `${guest.ready ? 'Ready' : 'Not Ready'}`}
      </td>
      <td>${guest.host ? '' : `<button id="${guest.id}" class="lobby-button kick">Kick</button>`}</td>
    </tr>`
  );
}

function checkIfUserWasKicked(list) {
  list.forEach((guests) => {
    for (let j = 0; j < guests.length; j++) {
      if (userId == guests[j].id) return false;
    }
  })
  return true;
}

function initLobby() {
  socket.on('lobby-update-guests', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.host && startButton) startButton.disabled = !data.guestsReady;
  
      console.log(data);
      for (let i = 0; i < data.list.length; i++) {
        const tbody = document.getElementById(`list-${i}`);
        tbody.innerHTML = '';
        data.list[i].forEach((guest) => {
          if (data.host) tbody.innerHTML += createGuestRowAsHost(guest);
          else tbody.innerHTML += createGuestRow(guest);
        })
      }
  
      addKickButtonListener();
    } catch (err) {
      console.error(err);
    }
  });
  
  socket.on('lobby-kick-player', (message) => {
    try {
      const data = JSON.parse(message);
  
      if (data.host && startButton) {
        startButton.disabled = !data.guestsReady;
      } else if (checkIfUserWasKicked(data.list)) {
        window.location.href = `${baseURL}/find-lobby`;
        return;
      }
  
      for (let i = 0; i < data.list.length; i++) {
        const tbody = document.getElementById(`list-${i}`);
        tbody.innerHTML = '';

        data.list[i].forEach((guest) => {
          if (data.host) tbody.innerHTML += createGuestRowAsHost(guest);
          else tbody.innerHTML += createGuestRow(guest);
        })
      }
  
      addKickButtonListener();
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('lobby-update', (message) => {
    try {
      const data = JSON.parse(message);
      let count = 1;

      lobbyTitle.innerHTML = data.lobbyName;
      lobbyName = data.lobbyName;
      maxPlayers = data.maxPlayers;
      isPrivate = data.isPrivate;
      lobbyTypeLogo.setAttribute('src', isPrivate ? '/images/private.png' : '/images/public.png');

      for (let i = 0; i < 2; i++) {
        const tbody = document.getElementById(`list-${i}`);
        const guests = tbody.children;

        for (let j = 0; j < guests.length; j++) {
          const guest = guests[j];
          if (count > maxPlayers) {
            guest.className = 'lobby-unavailable';
          } else if (guest.className == 'lobby-unavailable') {
            guest.className = 'lobby-guest'
          }
          count += 1;
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('upgrade-to-lobby-host', (message) => {
    try {
      const data = JSON.parse(message);

      if (lobbyMenu) {
        lobbyMenu.innerHTML = `<img id="uno-lobby-logo" src="/images/uno-logo.png">
        <div id="invitation-container">
          <span id="invite-error" class="invite-error hidden"></span>
          <form>
            <input type="text" placeholder="Username" id="username" name="username">
            <button class="lobby-button">Invite</button>
          </form>
        </div>
        <div id="lobby-options">
          <button ${data.guestsReady ? '' : 'disabled'} id="start-button" class="lobby-button">Start</button>
          <button id="leave-button" class="lobby-button">Leave Lobby</button>
        </div>
        `;
        document.getElementById('settings').className = '';
        leaveButton = document.getElementById('leave-button');
        startButton = document.getElementById('start-button');
        if (leaveButton) {
          leaveButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
      
            fetch(`/api/lobbies/${lobbyId}/users`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              }
            })
            .then(res => res.json())
            .catch((err) => console.error(err));
          })
        }
        if (startButton) {
          startButton.addEventListener('click', (e) => {
            console.log('clicked');
            fetch(`/api/games/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ lobbyId })
            })
            .then(async (res) => {
              if (res.status != 200) {
                const data = await res.json();
              }
            })
            .catch((err) => console.error(err));
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('redirect', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.pathname) window.location.href = baseURL + data.pathname;
    } catch (err) {
      console.error(err);
    }
  });
    
  if (readyButton) {
    readyButton.addEventListener('click', (e) => {
      fetch(`/api/lobbies/${lobbyId}/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .catch((err) => console.error(err));
    });
  }
  
  if (startButton) {
    startButton.addEventListener('click', (e) => {
      // verify all users are "Ready"
      for (let i = 0; i < 2; i++) {
        const tbody = document.getElementById(`list-${i}`);
        const guests = tbody.children;

        for (let j = 0; j < guests.length; j++) {
          const elements = guests[i].getElementsByClassName('lobby-guest-status');
          if (elements) {
            const status = elements.item(0);
            if (status && status.innerHTML.trim() != '' && status.innerHTML.trim().toLowerCase() != 'host') {
              if (status.innerHTML.trim().toLowerCase() != 'ready') return;
            }
          }
        }
      }

      fetch(`/api/games/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lobbyId })
      })
      .then(async (res) => {
        if (res.status != 200) {
          const data = res.json();
        }
      })
      .catch((err) => console.error(err));
    });
  }
  
  if (leaveButton) {
    leaveButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      fetch(`/api/lobbies/${lobbyId}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(res => res.json())
      .catch((err) => console.error(err));
    });
  }

  if (inviteInput && inviteButton) {
    inviteButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (inviteInput.value.trim().length > 0) {
        fetch(`/api/lobbies/${lobbyId}/invitations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: inviteInput.value })
        })
        .then(async (res) => {
          const data = await res.json();
          const inviteError = document.getElementById('invite-error');
          if (res.status != 201 && data.message) {
            inviteError.className = 'invite-error';
            inviteError.innerHTML = data.message;
          } else if (data.message) {
            inviteError.className = 'invite-success';
            inviteError.innerHTML = data.message;
          }
        })
        .catch((err) => console.error(err));
      }
    });
  }

  if (settings) {
    settings.addEventListener('click', (event) => {
      popupContainer.className = '';
    })
  }

  addKickButtonListener();

  window.addEventListener('pageshow', () => {
    const entries = performance.getEntriesByType('navigation');
    if (entries && entries.length > 0) {
      const navigationType = entries[0].type;
      if (navigationType === 'back_forward' && socket.connected) {
        window.location.reload();
      }
    }
  });
}
