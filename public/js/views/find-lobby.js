import serializeForm from '../lib/serializeForm.js';

const socket = io();
const baseURL = `${window.location.protocol}//${window.location.host}`;
const refreshButton = document.getElementById("refresh");
const privateLobbyClose = document.getElementById("join-private-close-modal");
const fullLobbyClose = document.getElementById("lobby-full-modal");
const searchLobbiesForm = document.getElementById("search-lobbies-form");
const joinPrivateLobbyForm = document.getElementById("join-private-lobby-form");

if (socket) {
  socket.on('redirect', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.pathname) window.location.href = baseURL + data.pathname;
    } catch (err) {
      console.error(err);
    }
  })
}

window.addEventListener('load', () => {
  fetch('/api/lobbies/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(async (res) => {
    const data = await res.json();
    displayLobbies(data);
  })
  .catch((err) => {
    console.error(err);
  })
});

searchLobbiesForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const searchInput = document.getElementById("lobby-search-input").value;

  fetch(`/api/lobbies/search?name=${searchInput}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(async (res) => {
    const data = await res.json();
    document.getElementById("lobbyListContainer").innerHTML = '';
    displayLobbies(data);
  })
  .catch((err) => {
    console.error(err);
  })
})

refreshButton.addEventListener('click', ()=> {
  document.getElementById("lobbyListContainer").innerHTML = '';

  const searchInput = document.getElementById("lobby-search-input").value;

  if(document.getElementById("lobby-search-input").value) {
    fetch(`/api/lobbies/search?name=${searchInput}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(async (res) => {
      const data = await res.json();
      document.getElementById("lobbyListContainer").innerHTML = '';
      displayLobbies(data);
    })
    .catch((err) => {
      console.error(err);
    });
  }
  else {
    fetch('/api/lobbies/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(async (res) => {
      const data = await res.json();
      displayLobbies(data);
    })
    .catch((err) => {
      console.error(err);
    });
  }
})

privateLobbyClose.addEventListener('click', () => {
  const joinLobbyFormModal = document.getElementById("join-private-lobby-modal");
  const passwordInput = document.getElementById("password");
  joinPrivateLobbyForm.removeEventListener('submit', joinPrivateLobby);
  joinPrivateLobbyForm.removeAttribute('lobbyId');
  passwordInput.value = "";
  joinLobbyFormModal.style.display = "none";
});

fullLobbyClose.addEventListener('click', () => {
  const lobbyFullModal = document.getElementById("lobby-full-modal");
  lobbyFullModal.style.display = "none";
});

async function displayLobbies(data) {
    data.results.forEach((lobby) => {
      const { id, hostName, name, playerCapacity, guestLength, type } = lobby;
      const newLobby = document.createElement("div");
      const lobbyName = document.createElement("div");
      const playerCount = document.createElement("div");
      const host = document.createElement("div");
      const joinButton = document.createElement("button");
      const lobbyType = document.createElement("div");

      newLobby.id = id;
      newLobby.className= "lobby-container"; 
      lobbyName.className = "lobby-name";
      lobbyName.innerHTML = name;
      playerCount.innerHTML = 1 + guestLength + "/" + playerCapacity;
      joinButton.innerHTML = "Join";
      host.innerHTML = hostName;
      lobbyType.innerHTML = type;
      
      joinButton.onclick = function () { joinLobby(id) }

      newLobby.appendChild(lobbyName)
      newLobby.appendChild(host)
      newLobby.appendChild(lobbyType)
      newLobby.appendChild(playerCount)
      newLobby.append(joinButton)

      document.getElementById("lobby-list-container").appendChild(newLobby);
    });
}

async function isLobbyGuest(lobbyId) {
  const url = window.location.protocol + '//' + window.location.host;
  return fetch(url + `/api/lobbies/${lobbyId}/users/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(async (res) => {
    if (res.redirected) {
      window.location.href = res.url;
    } else {
      const data = await res.json();
      return Promise.resolve(data.isGuest);
    }
  })
  .catch((err) => {
    console.error(err);
    return Promise.reject(err);
  })
}

async function getLobbyInfo(lobbyId) {
  const url = window.location.protocol + '//' + window.location.host;
  return fetch(url + `/api/lobbies/${lobbyId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(async (res) => {
    if (res.redirected) {
      window.location.href = res.url;
    } else {
      const data = await res.json();
      return Promise.resolve(data);
    }
  })
  .catch((err) => {
    console.error(err);
    return Promise.reject(err);
  })
}

async function joinPrivateLobby(event) {
  event.preventDefault();
  event.stopPropagation();

  const url = window.location.protocol + '//' + window.location.host;
  const serializedData = serializeForm(joinPrivateLobbyForm);
  fetch(url + `/api/lobbies/${joinPrivateLobbyForm.getAttribute('lobbyId')}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serializedData),
  })
  .then(async (res) => {
    if (res.redirected) {
      window.location.href = res.url;
    } else {
      const data = await res.json();
      if (res.status === 401) {
        const error = document.getElementById('lobby-password-error');
        error.innerHTML = data.message;
        error.style.display = "block";
      } else console.log(data);
    }
  })
  .catch((err) => console.error(err));
}

async function joinLobby(lobbyId) {
  const url = window.location.protocol + '//' + window.location.host;
  const isGuest = await isLobbyGuest(lobbyId);
  const lobbyInfo = await getLobbyInfo(lobbyId);
  if(isGuest) {
    return document.location.href=url+`/lobbies/${lobbyId}`;
  }

  if(lobbyInfo.numPlayers + 1 >= lobbyInfo.playerCapacity) {
    const lobbyFullModal = document.getElementById("lobby-full-modal");
    return lobbyFullModal.style.display = "block";
  }

  if(lobbyInfo.type == "private") {
    const joinLobbyFormModal = document.getElementById("join-private-lobby-modal");
    const error = document.getElementById('lobby-password-error');
    const lobbyName = document.getElementById("form-lobby-name");
    error.innerHTML = "";
    error.style = "style:none";
    lobbyName.innerHTML = lobbyInfo.name;
    joinLobbyFormModal.style.display = "block";
    joinPrivateLobbyForm.setAttribute('lobbyId', lobbyId);
    joinPrivateLobbyForm.addEventListener('submit', joinPrivateLobby);
  }
  else {
    fetch(url + `/api/lobbies/${lobbyId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(async (res) => {
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const data = await res.json();
        console.log(data);
      }
    })
    .catch((err) => console.error(err));
  }
}

