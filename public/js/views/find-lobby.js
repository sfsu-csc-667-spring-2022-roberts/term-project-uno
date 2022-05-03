const socket = io();
const baseURL = `${window.location.protocol}//${window.location.host}`;

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
    data.results.forEach((lobby) => {
      console.log(lobby);
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

      document.getElementById("lobbyListContainer").appendChild(newLobby);
    });
  })
  .catch((err) => {
    console.error(err);
  });
});

async function joinLobby(lobbyId) {
  fetch(`/api/lobbies/${lobbyId}/users`, {
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
    }
  })
  .catch((err) => console.error(err));
}
