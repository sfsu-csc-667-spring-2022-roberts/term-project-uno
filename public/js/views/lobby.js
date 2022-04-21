const socket = io();
const kickButtons = document.getElementsByClassName('kick')
const leftTableBody = document.getElementById('list-1');
const rightTableBody = document.getElementById('list-2');
const lobbyMenu = document.getElementById('lobby-menu');
const baseURL = `${window.location.protocol}//${window.location.host}`;
let leaveButton = document.getElementById('leave-button');

async function start(lobbyId) {
  fetch(baseURL + '/api/games/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({id: lobbyId}),
  })
  .then(async (res) => {
    if (res.redirected) {
      window.location.href = res.url;
    }
  })
  .catch((err) => {
    console.error(err);
  });
}

function joinLobbyRoom() {
  socket.emit('join-lobby-room', JSON.stringify({ lobbyId }));
}

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

if (socket) {
  socket.on('lobby-update-guests', (message) => {
    try {
      const data = JSON.parse(message);

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
  })
  
  socket.on('lobby-kick-player', (message) => {
    try {
      const data = JSON.parse(message);
  
      if (checkIfUserWasKicked(data.leftList, data.rightList)) {
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
  })
  
  /*
            <div id="lobby-menu">
            <h3 id="lobby-title">{{lobbyName}}</h3>
            {{#if isHost}}
            <div id="invitation-container">
              <span id="invite-error" class="invite-error hidden"></span>
              <form>
                <input type="text" placeholder="Username" id="username" name="username">
                <button class="lobby-button">Invite</button>
              </form>
            </div>
            {{else}}
            {{/if}}
            <div id="lobby-options">
              {{#if isHost}}
              <button class="lobby-button" onclick="start({{lobbyId}})">Start</button>
              {{else}}
              <button class="lobby-button">Ready</button>
              {{/if}}
              <button id='leave-button' class="lobby-button">Leave Lobby</button>
            </div>
          </div>
        </div>
  */

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
          <button id="start-button" class="lobby-button">Start</button>
          <button id="leave-button" class="lobby-button">Leave Lobby</button>
        </div>
        `;
        leaveButton = document.getElementById('leave-button');
        leaveButton.addEventListener('click', (e) => {
          socket.emit('leave-lobby', JSON.stringify({
            lobbyId
          }));
        })
      }
    } catch (err) {
      console.error(err);
    }
  })

  socket.on('redirect', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.pathname) window.location.href = baseURL + data.pathname;
    } catch (err) {
      console.error(err);
    }
  })
  
  joinLobbyRoom();
  addKickButtonListener();
}

if (leaveButton) {
  leaveButton.addEventListener('click', (e) => {
    socket.emit('leave-lobby', JSON.stringify({
      lobbyId
    }));
  })
}