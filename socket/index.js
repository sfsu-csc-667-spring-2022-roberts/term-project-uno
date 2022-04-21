const socketIo = require('socket.io');
const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestDao = require('../db/dao/lobbyGuests');
const PlayerDao = require('../db/dao/players');
const MessageDao = require('../db/dao/messages');
const { splitLobbyMembers } = require('../lib/utils/socket');
const { parseToken } = require('../lib/utils/token');
const { parseCookies } = require('../lib/utils/cookies');
const userSockets = {};

function addToUserSockets(userId, socket) {
  if (userSockets[userId]) {
    userSockets[userId].push(socket);
  } else userSockets[userId] = [socket];
}

function removeFromUserSockets(userId, socket) {
  for (let i = 0; i < userSockets[userId].length; i++) {
    if (userSockets[userId][i].id === socket.id) {
      if (userSockets[userId].length === 1) delete userSockets[userId];
      else userSockets[userId].splice(i, 1);
      return;
    }
  }
}

function getSocketsFromUserSockets(userId) {
  return userSockets[userId];
}

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

    socket.on('join-lobby-room', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user) return;
        if (await LobbyDao.verifyHost(user.id, data.lobbyId)) {
          socket.join(`lobby-host/${data.lobbyId}`);
          socket.join(`lobby/${data.lobbyId}`);
        } else if (await LobbyGuestDao.verifyGuest(user.id, data.lobbyId)) {
          socket.join(`lobby-guest/${data.lobbyId}`);
          socket.join(`lobby/${data.lobbyId}`);
        }
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

        const lobby = await LobbyDao.findLobby(data.lobbyId);
        if (!lobby) return;

        const lobbyGuests = await LobbyGuestDao.findAllLobbyGuests(data.lobbyId);

        // Full Lobby
        if (lobbyGuests.length + 2 > lobby.playerCapacity) return;

        // Already a lobby member
        if (user.id == lobby.hostId) {
          socket.emit('redirect', JSON.stringify({ pathname: `/lobby/${data.lobbyId}` }));
          return;
        }
        for (let i = 0; i < lobbyGuests.length; i++) {
          if (user.id == lobbyGuests[i].id) {
            socket.emit('redirect', JSON.stringify({ pathname: `/lobby/${data.lobbyId}` }));
            return;
          }
        }

        await LobbyGuestDao.addGuest(user.id, data.lobbyId);

        const lobbyMembers = await LobbyDao.findAllMembers(data.lobbyId);
        const { leftList, rightList } = splitLobbyMembers(lobbyMembers);

        io.to(`lobby-guest/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
        io.to(`lobby-host/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({
          host: true, leftList, rightList
        }));
        socket.emit('redirect', JSON.stringify({ pathname: `/lobby/${data.lobbyId}` }));
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('leave-lobby', async (message) => {
      try {
        data = JSON.parse(message);

        const lobby = await LobbyDao.findLobby(data.lobbyId);
        if (!lobby) return;

        if (user.id == lobby.hostId) {
          const nextHostId = await LobbyGuestDao.removeOldestGuest(data.lobbyId);
          const nextHostSockets = getSocketsFromUserSockets(nextHostId);

          await LobbyDao.setHost(nextHostId, data.lobbyId);
          
          nextHostSockets.forEach((hostSocket) => {
            if (hostSocket.rooms.has(`lobby-guest/${data.lobbyId}`)) {
              hostSocket.leave(`lobby-guest/${data.lobbyId}`);
              hostSocket.join(`lobby-host/${data.lobbyId}`)
              hostSocket.emit('upgrade-to-lobby-host', JSON.stringify({ upgrade: true }));
            }
          });
        } else await LobbyGuestDao.remove(user.id, data.lobbyId);

        socket.emit('redirect', JSON.stringify({ pathname: `/find-lobby` }));

        const lobbyMembers = await LobbyDao.findAllMembers(data.lobbyId);
        const { leftList, rightList } = splitLobbyMembers(lobbyMembers);

        io.to(`lobby-guest/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
        io.to(`lobby-host/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({
          host: true, leftList, rightList
        }));
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-kick-player', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

        await LobbyGuestDao.remove(data.userId, data.lobbyId);
        const lobbyMembers = await LobbyDao.findAllMembers(data.lobbyId);
        const { leftList, rightList } = splitLobbyMembers(lobbyMembers);

        io.to(`lobby-guest/${data.lobbyId}`).emit('lobby-kick-player', JSON.stringify({ leftList, rightList }));
        io.to(`lobby-host/${data.lobbyId}`).emit('lobby-kick-player', JSON.stringify({
          host: true, leftList, rightList
        }));
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