const kickButtons = document.getElementsByClassName('kick')
const leftTableBody = document.getElementById('list-1');
const rightTableBody = document.getElementById('list-2');
const lobbyMenu = document.getElementById('lobby-menu');
const readyButton = document.getElementById('ready-button');
const baseURL = `${window.location.protocol}//${window.location.host}`;
let leaveButton = document.getElementById('leave-button');
let startButton = document.getElementById('start-button');
let inviteInput = document.getElementById('username');
let inviteButton = document.getElementById('invite-button');

function addKickButtonListener() {
  if (kickButtons) {
    for (let button of kickButtons) {
      button.addEventListener('click', (e) => {
        socket.emit('lobby-kick-player', JSON.stringify({
          lobbyId,
          userId: button.id,
        }));
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
  return (
    `<tr class="lobby-guest">
      <td class="lobby-guest-icon-col">
        <div class="lobby-guest-icon">
          <img src="${guest.avatar ? guest.avatar : '/images/default-profile-pic.png'}">
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
  return (
    `<tr class="lobby-guest">
      <td class="lobby-guest-icon-col">
        <div class="lobby-guest-icon">
          <img src="${guest.avatar ? guest.avatar : '/images/default-profile-pic.png'}">
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

function checkIfUserWasKicked(leftList, rightList) {
  for (let i = 0; i < leftList.length; i++) {
    if (userId == leftList[i].id) return false;
  }
  for (let i = 0; i < rightList.length; i++) {
    if (userId == rightList[i].id) return false;
  }
  return true;
}

function initLobby() {
  socket.on('lobby-update-guests', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.host && startButton) startButton.disabled = !data.guestsReady;

      leftTableBody.innerHTML = '';
      rightTableBody.innerHTML = '';
  
      data.leftList.forEach((guest) => {
        if (data.host) leftTableBody.innerHTML += createGuestRowAsHost(guest);
        else leftTableBody.innerHTML += createGuestRow(guest);
      });
      data.rightList.forEach((guest) => {
        if (data.host) rightTableBody.innerHTML += createGuestRowAsHost(guest);
        else rightTableBody.innerHTML += createGuestRow(guest);
      });
  
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
      } else if (checkIfUserWasKicked(data.leftList, data.rightList)) {
        window.location.href = `${baseURL}/find-lobby`;
        return;
      }
  
      leftTableBody.innerHTML = '';
      rightTableBody.innerHTML = '';
  
      data.leftList.forEach((guest) => {
        if (data.host) leftTableBody.innerHTML += createGuestRowAsHost(guest);
        else leftTableBody.innerHTML += createGuestRow(guest);
      });
      data.rightList.forEach((guest) => {
        if (data.host) rightTableBody.innerHTML += createGuestRowAsHost(guest);
        else rightTableBody.innerHTML += createGuestRow(guest);
      });
  
      addKickButtonListener();
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('invite-to-lobby', (message) => {
    try {
      const data = JSON.parse(message);
      const inviteError = document.getElementById('invite-error');

      if (data.message) {
        inviteError.innerHTML = data.message;
      }

      if (data.error && inviteError) {
        inviteError.className = 'invite-error';
      } else if (inviteError) {
        inviteError.className = 'invite-success';
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('upgrade-to-lobby-host', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.upgrade && lobbyMenu) {
        lobbyMenu.innerHTML = `<h3 id="lobby-title">${lobbyName}</h3>
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
        leaveButton = document.getElementById('leave-button');
        startButton = document.getElementById('start-button');
        if (leaveButton) {
          leaveButton.addEventListener('click', (e) => {
            socket.emit('leave-lobby', JSON.stringify({
              lobbyId
            }));
          })
        }
        if (startButton) {
          startButton.addEventListener('click', (e) => {
            socket.emit('lobby-start-game', JSON.stringify({ lobbyId }));
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
      socket.emit('lobby-toggle-ready', JSON.stringify({ lobbyId }));
    });
  }
  
  if (startButton) {
    startButton.addEventListener('click', (e) => {
      const leftGuests = leftTableBody.children;
      const rightGuests = rightTableBody.children;

      for (let i = 0; i < leftGuests.length; i++) {
        const elements = leftGuests[i].getElementsByClassName('lobby-guest-status');
        if (elements) {
          const status = elements.item(0);
          if (status && status.innerHTML.trim() != '' && status.innerHTML.trim().toLowerCase() != 'host') {
            if (status.innerHTML.trim().toLowerCase() != 'ready') return;
          }
        }
      }
  
      for (let i = 0; i < rightGuests.length; i++) {
        const elements = rightGuests[i].getElementsByClassName('lobby-guest-status');
        if (elements) {
          const status = elements.item(0);
          if (status && status.innerHTML.trim() != '' && status.innerHTML.trim().toLowerCase() != 'host') {
            if (status.innerHTML.trim().toLowerCase() != 'ready') return;
          }
        }
      }

      socket.emit('lobby-start-game', JSON.stringify({ lobbyId }));
    });
  }
  
  if (leaveButton) {
    leaveButton.addEventListener('click', (e) => {
      socket.emit('leave-lobby', JSON.stringify({
        lobbyId
      }));
    });
  }

  if (inviteInput && inviteButton) {
    inviteButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (inviteInput.value.trim().length > 0) {
        socket.emit('invite-to-lobby', JSON.stringify({ lobbyId, username: inviteInput.value }));
      }
    });
  }

  addKickButtonListener();

  window.addEventListener('pageshow', () => {
    const entries = performance.getEntriesByType('navigation');
    if (entries && entries.length > 0) {
      const navigationType = entries[0].type;
      if ((navigationType === 'reload' || navigationType === 'back_forward') && socket.connected) {
        window.location.reload();
      }
    }
  });
}
