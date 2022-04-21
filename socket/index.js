const socketIo = require('socket.io');
const LobbyDao = require('../db/dao/lobbies');
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

    if (user) socket.join(user.id);

    socket.on('join-lobby-room', async (message) => {
      try {
        data = JSON.parse(message);
        if (!user || !(await LobbyDao.verifyHostOrGuest(user.id, data.lobbyId))) return;

        socket.join(`lobby/${data.lobbyId}`);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('join-game-room', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await PlayerDao.verifyUserInGame(data.gameId, user.id))) return;

        socket.join(`game/${data.gameId}`);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('invite-to-lobby', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

        /*
          Create invitation for user if not already exists
          Broadcast to user's clients
          Respond to sender with success
        */
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-join', async (message) => {
      try {
        data = JSON.parse(message);

        // copy implementation from http endpoint
        // Get new list of players
        // Broadcast to relevant clients
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-leave', async (message) => {
      try {
        data = JSON.parse(message);
    

      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-kick-player', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

        /*
          Remove player to kick from lobbyGuests
          Get new list of players
          Broadcast to relevant clients
        */
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-start-game', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

        // copy http implementation here
        // broadcast redirect to all clients
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-message-send', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyDao.verifyHostOrGuest(user.id, data.lobbyId))) return;

        const messageObj = await MessageDao.createLobbyMessage(data.message, user.id, data.lobbyId);

        messageObj.sender = user.username;
        delete messageObj.userId;
        delete messageObj.gameId;

        io.to(`lobby/${data.lobbyId}`).emit('lobby-message-send', messageObj);
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