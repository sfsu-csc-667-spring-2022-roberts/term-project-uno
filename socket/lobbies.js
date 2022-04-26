const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestDao = require('../db/dao/lobbyGuests');
const GameDao = require('../db/dao/games');
const CardDao = require('../db/dao/cards');
const PlayerCardDao = require('../db/dao/playerCards');
const PlayedCardDao = require('../db/dao/playedCards');
const DrawCardDao = require('../db/dao/drawCards');
const PlayerDao = require('../db/dao/players');
const MessageDao = require('../db/dao/messages');
const { getSocketsFromUserSockets, broadcastLobbyMemberJoin, broadcastLobbyMemberLeave, 
  broadcastLobbyMemberKicked, broadcastLobbyMembers } = require('../lib/utils/socket');

async function initializeLobbyEndpoints(io, socket, user) {
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

  socket.on('lobby-toggle-ready', async (message) => {
    try {
      data = JSON.parse(message);

      if (!user || !(await LobbyGuestDao.verifyGuest(user.id, data.lobbyId))) return;

      await LobbyGuestDao.toggleReady(user.id, data.lobbyId);

      broadcastLobbyMembers(io, data.lobbyId);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('lobby-join', async (message) => {
    try {
      data = JSON.parse(message);

      const lobby = await LobbyDao.findLobby(data.lobbyId);
      if (!lobby || lobby.busy) return;

      const lobbyGuests = await LobbyGuestDao.findAllLobbyGuests(data.lobbyId);

      // Full Lobby
      if (lobbyGuests.length + 2 > lobby.playerCapacity) return;

      // Already a lobby member
      if (user.id == lobby.hostId) {
        return socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
      }
      for (let i = 0; i < lobbyGuests.length; i++) {
        if (user.id == lobbyGuests[i].userId) {
          return socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
        }
      }

      await LobbyGuestDao.addGuest(user.id, data.lobbyId);

      await broadcastLobbyMemberJoin(io, user.id, data.lobbyId);
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

      const userSockets = getSocketsFromUserSockets(user.id);
      /* If the host is leaving the lobby, then a new host must be assigned */
      if (user.id == lobby.hostId) {
        let nextHostId;
        try {
          nextHostId = await LobbyGuestDao.removeOldestGuest(data.lobbyId);
        } catch (err) {
          // If there are no more guests, then delete the lobby
          await LobbyDao.deleteLobby(data.lobbyId);
          userSockets.forEach((userSocket) => {
            if (userSocket.rooms.has(`lobby/${data.lobbyId}`)) {
              userSocket.emit('redirect', JSON.stringify({ pathname: `/find-lobby` }));
            }
          })
          return;
        }

        const nextHostSockets = getSocketsFromUserSockets(nextHostId);
        await LobbyDao.setHost(nextHostId, data.lobbyId);
        const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(data.lobbyId);
        nextHostSockets.forEach((hostSocket) => {
          if (hostSocket.rooms.has(`lobby-guest/${data.lobbyId}`)) {
            hostSocket.leave(`lobby-guest/${data.lobbyId}`);
            hostSocket.join(`lobby-host/${data.lobbyId}`)
            hostSocket.emit('upgrade-to-lobby-host', JSON.stringify({ guestsReady }));
          }
        });
      } else await LobbyGuestDao.remove(user.id, data.lobbyId);

      userSockets.forEach((userSocket) => {
        if (userSocket.rooms.has(`lobby/${data.lobbyId}`)) {
          userSocket.emit('redirect', JSON.stringify({ pathname: `/find-lobby` }));
        }
      })

      broadcastLobbyMemberLeave(io, user.id, data.lobbyId);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('lobby-kick-player', async (message) => {
    try {
      data = JSON.parse(message);

      if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

      await LobbyGuestDao.remove(data.userId, data.lobbyId);

      broadcastLobbyMemberKicked(io, user.username, data.userId, data.lobbyId);
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
}

module.exports = { initializeLobbyEndpoints };