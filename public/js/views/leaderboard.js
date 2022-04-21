window.addEventListener('load', () => {
  const url = window.location.protocol + '//' + window.location.host;
  fetch(url + '/leaderboardData', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(async (res) => {

    const data = await res.json();
    console.log(data)
    for(let i = 0; i<data.length; i++) {

      const { id, username, gamesWon, gamesPlayed, score } = data[i];


      const newPlayer = document.createElement("div");
      const playerName = document.createElement("div");
      const winMinusLose = document.createElement("div");

      newPlayer.className = "item-container"
      playerName.innerHTML = username
      winMinusLose.innerHTML = score

      newPlayer.appendChild(playerName)
      newPlayer.appendChild(winMinusLose)
  
      document.getElementById("PlayerListContainer").appendChild(newPlayer)

    }

  })
  .catch((err) => {
    console.log(err)
    console.error(err);
  });
});
