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
    for(let i = 0; i<5; i++) {

      const { id, username, gamesWon, gamesPlayed, score } = data[0];


      const newPlayer = document.createElement("tr");
      const playerName = document.createElement("td");
      const winMinusLose = document.createElement("td");

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
