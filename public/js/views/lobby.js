
async function start(lobbyId) {
  const url = window.location.protocol + '//' + window.location.host;

  fetch(url + '/api/games/', {
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