const PlayerDao = require('../db/dao/players');

async function initializeGameEndpoints(io, socket, user) {
  if (user) {
    try {
      const referer = socket.handshake.headers.referer;
      if (referer) {
        const requestUrl = new URL(referer);
        const pathnameSplit = requestUrl.pathname.split('/');
        if (pathnameSplit.length === 3 && pathnameSplit[1] === 'games') {
          const gameId = pathnameSplit[2];
          if (await PlayerDao.verifyUserInGame(gameId, user.id)) {
            socket.join(`game/${gameId}`);
          }
        }
      }
    } catch (err) {
      console.error('Error occured when attempting to join socket game room\n', err);
    }
  }
}

module.exports = { initializeGameEndpoints };