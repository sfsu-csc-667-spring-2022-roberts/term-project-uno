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
  const url = window.location.protocol + '//' + window.location.host;
  fetch(url + '/api/lobbies/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(async (res) => {
    const data = await res.json();
    for(let i = 0; i<data.length; i++) {
      const { id, hostName, name, playerCapacity, guests, type } = data[i];


      const newLobby = document.createElement("tr");
      const lobbyName = document.createElement("td");
      const playerCount = document.createElement("td");
      const host = document.createElement("td");
      const joinButton = document.createElement("button");
      const lobbyType = document.createElement("td");

      newLobby.id = id;
      newLobby.className= "item-container"; 
      // lobbyName.className = "lobby-name";
      lobbyName.innerHTML = name;
      playerCount.innerHTML = 1 + guests.length + "/" + playerCapacity;
      joinButton.innerHTML = "Join";
      host.innerHTML = hostName;
      lobbyType.innerHTML = type;
      
      joinButton.onclick = function () { joinLobby(id) }

      newLobby.appendChild(lobbyName)
      newLobby.appendChild(host)
      newLobby.appendChild(lobbyType)
      newLobby.appendChild(playerCount)
      newLobby.append(joinButton)

      document.getElementById("PlayerListContainer").appendChild(newLobby);
    }
  })
  .catch((err) => {
    console.error(err);
  });
});

async function joinLobby(lobbyId) {
  socket.emit('lobby-join', JSON.stringify({ lobbyId }));
}
