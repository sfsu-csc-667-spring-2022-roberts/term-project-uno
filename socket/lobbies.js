const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestDao = require('../db/dao/lobbyGuests');

async function joinSocketLobbyRoom(socket, user) {
  if (user) {
    try {
      const referer = socket.handshake.headers.referer;
      if (referer) {
        const requestUrl = new URL(referer);
        const pathnameSplit = requestUrl.pathname.split('/');
        if (pathnameSplit.length === 3 && pathnameSplit[1] === 'lobbies') {
          const lobbyId = pathnameSplit[2];
          if (await LobbyDao.verifyHost(user.id, lobbyId)) {
            socket.join(`lobby-host/${lobbyId}`);
            socket.join(`lobby/${lobbyId}`);
          } else if (await LobbyGuestDao.verifyGuest(user.id, lobbyId)) {
            socket.join(`lobby-guest/${lobbyId}`);
            socket.join(`lobby/${lobbyId}`);
          }
        }
      }
    } catch (err) {
      console.error('Error occured when attempting to join socket lobby room\n', err);
    }
  }
}

module.exports = { joinSocketLobbyRoom };