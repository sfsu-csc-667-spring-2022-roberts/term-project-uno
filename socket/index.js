const socketIo = require('socket.io');
const UserDao = require('../db/dao/users');
const CardDao = require('../db/dao/cards');
const PlayerCardDao = require('../db/dao/playerCards');
const PlayedCardDao = require('../db/dao/playedCards');
const DrawCardDao = require('../db/dao/drawCards');
const GameDao = require('../db/dao/games');
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

    socket.on('lobby-toggle-ready', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyGuestDao.verifyGuest(user.id, data.lobbyId))) return;

        await LobbyGuestDao.toggleReady(user.id, data.lobbyId);

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
          socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
          return;
        }
        for (let i = 0; i < lobbyGuests.length; i++) {
          if (user.id == lobbyGuests[i].userId) {
            socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
            return;
          }
        }

        await LobbyGuestDao.addGuest(user.id, data.lobbyId);

        const userInfo = await UserDao.findUserById(user.id);
        const lobbyMembers = await LobbyDao.findAllMembers(data.lobbyId);
        const { leftList, rightList } = splitLobbyMembers(lobbyMembers);
        const notification = {
          notification: true,
          message: `${userInfo.username} joined the lobby`,
          createdAt: (new Date()).toISOString()
        };

        io.to(`lobby-guest/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
        io.to(`lobby-host/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({
          host: true, leftList, rightList
        }));
        io.to(`lobby/${data.lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
        socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
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
          let nextHostId;
          try {
            nextHostId = await LobbyGuestDao.removeOldestGuest(data.lobbyId);
          } catch (err) {
            await LobbyDao.deleteLobby(data.lobbyId);
            socket.emit('redirect', JSON.stringify({ pathname: `/find-lobby` }));
            return;
          }

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

        const userInfo = await UserDao.findUserById(user.id);
        const lobbyMembers = await LobbyDao.findAllMembers(data.lobbyId);
        const { leftList, rightList } = splitLobbyMembers(lobbyMembers);
        const notification = {
          notification: true,
          message: `${userInfo.username} left the lobby`,
          createdAt: (new Date()).toISOString()
        };

        io.to(`lobby-guest/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
        io.to(`lobby-host/${data.lobbyId}`).emit('lobby-update-guests', JSON.stringify({
          host: true, leftList, rightList
        }));
        io.to(`lobby/${data.lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-kick-player', async (message) => {
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

        await LobbyGuestDao.remove(data.userId, data.lobbyId);
        const kickedUser = await UserDao.findUserById(data.userId);
        const lobbyMembers = await LobbyDao.findAllMembers(data.lobbyId);
        const { leftList, rightList } = splitLobbyMembers(lobbyMembers);
        const notification = {
          notification: true,
          message: `${user.username} kicked ${kickedUser ? kickedUser.username : 'Deleted User'} from the lobby`,
          createdAt: (new Date()).toISOString()
        }

        io.to(`lobby-guest/${data.lobbyId}`).emit('lobby-kick-player', JSON.stringify({ leftList, rightList }));
        io.to(`lobby-host/${data.lobbyId}`).emit('lobby-kick-player', JSON.stringify({
          host: true, leftList, rightList
        }));
        io.to(`lobby/${data.lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('lobby-start-game', async (message) => {
      const NUM_STARTING_CARDS = 7;
      try {
        data = JSON.parse(message);

        if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

        // Lobby is already in session
        if (await GameDao.gameWithLobbyExists(data.lobbyId)) return;
    
        const lobbyGuests = await LobbyGuestDao.findAllLobbyGuests(data.lobbyId);
        // Minimum 2 Players needed
        if (lobbyGuests.length === 0) return;
    
        for (let i = 0; i < lobbyGuests.length; i++) {
          if(lobbyGuests[i].userReady === false) { 
            // not all players are ready
            return;
          }
        }
    
        const cards = await Promise.all([CardDao.getAllNormalCards(), CardDao.getAllSpecialCards()]);
        const normalCards = cards[0];
        const specialCards = cards[1];
        const createPlayers = [];
        let turnIndex = 0;
    
        // Randomly pick the first card on the played stack
        const randomIndex = Math.floor(Math.random() * normalCards.length);
        const firstCard = normalCards[randomIndex];
        normalCards.splice(randomIndex, 1);
    
        // Combine normal cards + special cards
        const allCards = normalCards.concat(specialCards);
        // Shuffle cards
        const shuffledCards = allCards.sort(() => Math.random() - 0.5);
        // Create game
        const game = await GameDao.createGame(firstCard.color, data.lobbyId);
        LobbyDao.setBusy(data.lobbyId, true);
    
        // Create full list of lobby members and shuffle
        lobbyGuests.push({ 'userId': user.id });
        const shuffledLobbyMembers = lobbyGuests.sort(() => Math.random() - 0.5);
        // Create a player out of each lobby member
        shuffledLobbyMembers.forEach((lobbyMember) => {
          createPlayers.push(PlayerDao.createPlayer(turnIndex, lobbyMember.userId, game.id));
          turnIndex += 1;
        });
    
        const createdEntities = await Promise.all([
          PlayedCardDao.createPlayedCard(firstCard.id, game.id), Promise.all(createPlayers)
        ]);
        const players = createdEntities[1];
        const createPlayerCards = [];
        const createDrawCards = [];
        let shuffledCardsIdx = 0;
    
        // Give each player 7 cards
        players.forEach((player) => {
          for (let i = 0; i < NUM_STARTING_CARDS; i++) {
            createPlayerCards.push(PlayerCardDao.createPlayerCard(shuffledCards[shuffledCardsIdx].id, player.id));
            shuffledCardsIdx += 1;
          }
        });
    
        // Create the draw stack
        for (let i = shuffledCardsIdx; i < shuffledCards.length; i++) {
          const card = shuffledCards[i];
          createDrawCards.push(DrawCardDao.createDrawCard(card.id, game.id));
        }
    
        await Promise.all([Promise.all(createPlayerCards), Promise.all(createDrawCards)]);
    
        console.log('here');
        io.to(`lobby/${data.lobbyId}`).emit('redirect', JSON.stringify({ pathname: `/games/${game.id}` }));
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
        delete messageObj.lobbyId;

        io.to(`lobby/${data.lobbyId}`).emit('lobby-message-send', JSON.stringify(messageObj));
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