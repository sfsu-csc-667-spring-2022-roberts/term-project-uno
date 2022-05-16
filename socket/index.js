const socketIo = require('socket.io');
const PlayerDao = require('../db/dao/players');
const MessageDao = require('../db/dao/messages');
const { initializeLobbyEndpoints } = require('./lobbies');
const { initializeInvitationEndpoints } = require('./invitations');
const { parseToken } = require('../lib/utils/token');
const { parseCookies } = require('../lib/utils/cookies');
const { addToUserSockets, removeFromUserSockets } = require('../lib/utils/socket');

function init(app, server) {
  const io = socketIo(server);

  app.set('io', io);

  io.on('connection', async (socket) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const user = cookies.token ? await parseToken(cookies.token) : null;

    if (user) {
      socket.join(user.id);
      addToUserSockets(user.id, socket);
    }

    socket.on('disconnect', () => {
      if (user) removeFromUserSockets(user.id, socket);
    });

    initializeLobbyEndpoints(io, socket, user);
    initializeInvitationEndpoints(io, socket, user);

    socket.on('join-game-room', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await PlayerDao.verifyUserInGame(data.gameId, user.id))) return;

        socket.join(`game/${data.gameId}`);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('game-message-send', async (message) => {
      try {
        data = JSON.parse(message);
        
        if (!user || !(await PlayerDao.verifyUserInGame(data.gameId, user.id))) return;

        const messageObj = await MessageDao.createGameMessage(data.message, user.id, data.gameId);

        messageObj.sender = user.username;
        delete messageObj.userId;
        delete messageObj.gameId;

        io.to(`game/${data.gameId}`).emit('game-message-send', messageObj);
      } catch (err) {
        console.error(err);
      }
    });
  });
}

module.exports = { init }