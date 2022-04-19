const socketIo = require('socket.io');
const PlayerDao = require('../db/dao/players');
const MessageDao = require('../db/dao/messages');
const { parseToken } = require('../lib/utils/token');
const { parseCookies } = require('../lib/utils/cookies');

const init = (app, server) => {
  const io = socketIo(server);

  app.set('io', io);

  io.on('connection', async (socket) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const user = cookies.token ? await parseToken(cookies.token) : null;

    socket.join(user.id);

    socket.on('join-game-room', async (message) => {
      try {
        data = JSON.parse(message);
        if (!user || !(await PlayerDao.verifyUserInGame(data.gameId, user.id))) return;

        socket.join(`game/${data.gameId}`);
      } catch (err) {
        console.error(err);
      }
    })

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