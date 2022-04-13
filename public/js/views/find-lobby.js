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

      document.getElementById("lobbyListContainer").appendChild(newLobby);
    }
  })
  .catch((err) => {
    console.error(err);
  });
});

async function joinLobby(lobbyId) {
  const url = window.location.protocol + '//' + window.location.host;
  fetch(url + '/api/lobbies/' + lobbyId + '/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(async (res) => {
    if (res.redirected) {
      window.location.href = res.url;
    }
  })
  .catch((err) => {
    console.error(err);
  })
}
