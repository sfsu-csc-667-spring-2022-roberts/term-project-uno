const socketIo = require('socket.io');
const PlayerDao = require('../db/dao/players');
const MessageDao = require('../db/dao/messages');
const { initializeInvitationEndpoints } = require('./invitations');
const { initializeLobbyEndpoints } = require('./lobbies');
const { parseToken } = require('../lib/utils/token');
const { parseCookies } = require('../lib/utils/cookies');
const { addToUserSockets, removeFromUserSockets } = require('../lib/utils/socket');
const io = socketIo();

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

  initializeInvitationEndpoints(io, socket, user);
  initializeLobbyEndpoints(io, socket, user);

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

module.exports = io;