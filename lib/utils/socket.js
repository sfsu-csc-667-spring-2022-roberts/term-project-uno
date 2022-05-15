const UserDao = require('../../db/dao/users');
const LobbyDao = require('../../db/dao/lobbies');
const LobbyGuestDao = require('../../db/dao/lobbyGuests');
const LobbyInvitationDao = require('../../db/dao/lobbyInvitations');
const GamesDao = require("../../db/dao/games");
const PlayersDao = require("../../db/dao/players");
const PlayedCardsDao = require("../../db/dao/playedCards");
const PlayerCardsDao = require("../../db/dao/playerCards");
const DrawCardsDao = require("../../db/dao/drawCards");
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

function splitLobbyMembers(lobbyMembers, maxPlayers) {
  const list = [];
  const leftList = [];
  const rightList = [];
  const emptyGuest = { empty: true };
  const unavailable = { unavailable: true };
  let count = 1;

  for (let i = 0; i < 5; i++) {
    if (i < lobbyMembers.length) {
      leftList.push(lobbyMembers[i]);
    } else if (count > maxPlayers) {
      leftList.push(unavailable);
    } else leftList.push(emptyGuest);
    count += 1;
  }

  for (let i = 0; i < 5; i++) {
    if (i + 5 < lobbyMembers.length) {
      rightList.push(lobbyMembers[i + 5]);
    } else if (count > maxPlayers) {
      rightList.push(unavailable);   
    } else rightList.push(emptyGuest);
    count += 1;
  }

  list.push(leftList);
  list.push(rightList);
  return list;
}

async function broadcastUpdatedInvitationList(io, userId) {
  const userSockets = getSocketsFromUserSockets(userId);

  if (userSockets && userSockets.length > 0) {
    const lobbyInvitations = await LobbyInvitationDao.findUsersInvitations(userId);
    const asyncTasks = [];
    const invitations = [];

    if (lobbyInvitations) {
      lobbyInvitations.forEach((invitation) => {
        asyncTasks.push(LobbyDao.findLobby(invitation.lobbyId));
      })

      const lobbiesInfo = await Promise.all(asyncTasks);

      for (let i = 0; i < lobbiesInfo.length; i++) {
        invitations.push({
          lobbyId: lobbyInvitations[i].lobbyId,
          lobbyName: lobbiesInfo[i].name,
          createdAt: lobbyInvitations[i].createdAt
        });
      }
    }

    userSockets.forEach((userSocket) => {
      userSocket.emit('notification', JSON.stringify({ invitations }));
    });
    io.to(`notification/${userId}`).emit('update-notifications', JSON.stringify({ invitations }));
  }
}

async function broadcastLobbyMembers(io, lobbyId) {
  const lobby = await LobbyDao.findLobby(lobbyId);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const list = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({ list }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({
    host: true, list, guestsReady
  }));
}

async function broadcastLobbyMemberJoin(io, userId, lobbyId) {
  const lobby = await LobbyDao.findLobby(lobbyId);
  const userInfo = await UserDao.findUserById(userId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const list = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const notification = {
    notification: true,
    message: `${userInfo.username} joined the lobby`,
    createdAt: (new Date()).toISOString()
  };

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({ list }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({
    host: true, list, guestsReady
  }));
  io.to(`lobby/${lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
}

async function broadcastLobbyMemberLeave(io, userId, lobbyId) {
  const lobby = await LobbyDao.findLobby(lobbyId);
  const userInfo = await UserDao.findUserById(userId);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const list = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);
  const notification = {
    notification: true,
    message: `${userInfo.username} left the lobby`,
    createdAt: (new Date()).toISOString()
  };

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({ list }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({
    host: true, list, guestsReady
  }));
  io.to(`lobby/${lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
}

async function broadcastLobbyMemberKicked(io, hostname, userId, lobbyId) {
  const lobby = await LobbyDao.findLobby(lobbyId);
  const kickedUser = await UserDao.findUserById(userId);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const list = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);
  const notification = {
    notification: true,
    message: `${hostname} kicked ${kickedUser ? kickedUser.username : 'Deleted User'} from the lobby`,
    createdAt: (new Date()).toISOString()
  }

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-kick-player', JSON.stringify({ list }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-kick-player', JSON.stringify({
    host: true, list, guestsReady
  }));
  io.to(`lobby/${lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
}
//================================================================================================================================
async function handleSkip() { return { skip: true }; }

async function handleReverse(game) {
  const rev =  await GamesDao.updateReversed(!game.playerOrderReversed, game.id)
  if (! rev) return { fail: true }
  return { reversed: true }
}
async function handlePlus2(game) {
  const count = await PlayersDao.findPlayersCount(game.id);

  if (count === -1) return { fail: true };

  let playerThatDrawsIndex;
  const amount = 2;

  if (game.playerOrderReversed) {
    if (game.turnIndex === 0) playerThatDrawsIndex = count - 1;
    else playerThatDrawsIndex = game.turnIndex - 1;
  } else {
    if (game.turnIndex === count - 1) playerThatDrawsIndex = 0;
    else playerThatDrawsIndex = game.turnIndex + 1;
  }

  const playerThatDraws = await PlayersDao.findPlayerByTurnIndex(game.id, playerThatDrawsIndex);
  if (!playerThatDraws) return { fail: true };

  const result = await handleDrawCards(game, playerThatDraws, amount);

  if (result.retval !== 1) return { fail: true };

  return { amount, playerThatDrawsIndex, skip: true, refreshDrawCards: result.update, drawDeckCount: result.drawDeckCount }
}
async function handlePlus4Choose(game, chosenColor) {

  const count = await PlayersDao.findPlayersCount(game.id);

  if (count === -1) return { fail: true };

  const updatingColor = await handleChoose(game, chosenColor);

  if (updatingColor.fail) return { fail: true};

  let playerThatDrawsIndex;
  const amount = 4;

  if (game.playerOrderReversed) {
    if (game.turnIndex === 0) playerThatDrawsIndex = count - 1;
    else playerThatDrawsIndex = game.turnIndex - 1;
  } else {
    if (game.turnIndex === count - 1) playerThatDrawsIndex = 0;
    else playerThatDrawsIndex = game.turnIndex + 1;
  }
  const playerThatDraws = await PlayersDao.findPlayerByTurnIndex(game.id, playerThatDrawsIndex);
  if (!playerThatDraws) return { fail: true };
  const result = await handleDrawCards(game, playerThatDraws, amount);

  if (result.retval !== 1) return { fail: true };

  return { amount, playerThatDrawsIndex, newColor: updatingColor.newColor, skip: true, refreshDrawCards: result.update, drawDeckCount: result.drawDeckCount }
}
async function handleChoose(game, chosenColor) {

  if (!chosenColor || !await GamesDao.updateColor(chosenColor, game.id)) return { fail: true };
  
  return { newColor: chosenColor };
}
async function handleSwap(game, player1, player2username, card) {
  if (!player2username) return { fail: true }

  const user2 = await UserDao.findUserByName(player2username);
  const player = await PlayersDao.findPlayer(user2.id);

  if (!player) return { fail: true }

  let p1cards = await PlayerCardsDao.findPlayerCardIdsAndDelete(player1.id);
  let p2cards = await PlayerCardsDao.findPlayerCardIdsAndDelete(player.id);

  await PlayedCardsDao.createPlayedCard(card.id, game.id);

  p1cards.filter(p1card => p1card.cardId !== card.id).forEach(p1card => PlayerCardsDao.createPlayerCard(p1card.cardId, player.id))
  p2cards.forEach(p2card => PlayerCardsDao.createPlayerCard(p2card.cardId, player1.id))

  return { swap: true, newColor: game.currentColor }
}

async function getNextTurn(game, skip) {

  const count = await PlayersDao.findPlayersCount(game.id);

  let newTurnIndex;

  if (count === -1) return -1;

  if (skip) {
    if (count === 2) return game.turnIndex;
    if (game.playerOrderReversed) {
      if (game.turnIndex === 0) newTurnIndex = count - 2;
      else if (game.turnIndex === 1) newTurnIndex = count - 1;
      else newTurnIndex = game.turnIndex - 2;
    } else {
      if (game.turnIndex === count - 1) newTurnIndex = 1
      else if (game.turnIndex === count - 2) newTurnIndex = 0;
      else newTurnIndex = game.turnIndex + 2;
    }
  } else {
    if (game.playerOrderReversed) {
      if (game.turnIndex === 0) newTurnIndex = count - 1;
      else newTurnIndex = game.turnIndex - 1;
    } else {
      if (game.turnIndex === count - 1) newTurnIndex = 0;
      else newTurnIndex = game.turnIndex + 1;
    }
  }

  if (!await GamesDao.updateTurn(newTurnIndex, game.id)) return -1;
  return newTurnIndex;
}

async function emitBasedOnCardType(game, player, card, io, chosenColor, player2username) {
  try {
    let newGameState = {};

    if (card.special) {
      switch (card.value) {
        case "skip": { newGameState = await handleSkip(); break; }
        case "reverse": { newGameState = await handleReverse(game); break; }
        case "plus2": { newGameState = await handlePlus2(game); break; }
        case "plus4choose": { newGameState = await handlePlus4Choose(game, chosenColor); break; }
        case "choose": { newGameState = await handleChoose(game, chosenColor); break; }
        case "swap": { newGameState = await handleSwap(game, player, player2username, card); break; }
        default: return;
      }
    }
    if (newGameState.fail) return;
  
    let newColor;
    if (newGameState.newColor) {
      newColor = newGameState.newColor;
      if (newGameState.swap) {
        card.color = newGameState.newColor;
  
        switch (newColor) {
          case "red": {card.hex = "#ee161f"; break;}
          case "blue": {card.hex = "#0063B3"; break;}
          case "yellow": {card.hex = "#f8db22"; break;}
          case "green": {card.hex = "#18A849"; break;}
          default: break;
        }
      }
    } else newColor = card.color;
  
    if (! await GamesDao.updateColor(newColor, game.id)) return;
    game = await GamesDao.findGame(game.id);
  
    let result1, result2;
    if (newGameState.swap !== true) {
      result1 = await PlayerCardsDao.removePlayerCard(card.id, player.id);
      result2 = await PlayedCardsDao.createPlayedCard(card.id, game.id);
      if (!result1 || !result2) return;
    }
    const newTurnIndex = await getNextTurn(game, newGameState.skip);
    if (!game || newTurnIndex === -1) return;
  
    newGameState.playerIndex = player.turnIndex;
    newGameState.newTurnIndex = newTurnIndex
    newGameState.playerOrderReversed = game.playerOrderReversed;
    newGameState.card = card;
    newGameState.currentColor = newColor;
  
    const cardCount = await PlayerCardsDao.findCardCount(player.id);
    if (cardCount === 0) {
      newGameState.winner = player.username;
      newGameState.lobbyId = game.lobbyId;
  
      await UserDao.addWin(player.userId);
  
      let players = await PlayersDao.findPlayersByGameId(game.id)

      if (players) {
        players = players.filter(p => p.id !== player.id)
        await Promise.all(players.map(async (p) => UserDao.addLoss(p.userId)));
        await LobbyDao.setBusy(game.lobbyId, false);
        await GamesDao.deleteGame(game.id);
      }
    }
    io.to(`game/${game.id}`).emit('play-card', newGameState);
  } catch (error) {
    console.log("Error in emit play card", error)
  }
}

async function handleDrawCards(game, player, amount) {
  let ret = { retval: 1, update: false, drawDeckCount: 0 }
  for (let i = 0; i < amount; i++) {
    const result1 = await DrawCardsDao.findTopOfDrawCards(game.id);
    if (!result1) return -1;
    const result2 = await DrawCardsDao.removeDrawCard(result1.cardId, game.id);
    if (!result2) return -1;
    const result3 = await PlayerCardsDao.createPlayerCard(result1.cardId, player.id);
    if (!result3) return -1;

    const count = await DrawCardsDao.findCardCount(game.id);
    if (count === 0) {
      let playedDeck = await PlayedCardsDao.findAllPlayedCards(game.id);
      playedDeck = playedDeck.filter((r, i) => i !== (playedDeck.length-1));

      while (playedDeck.length > 0) {
        const index = Math.floor(Math.random() * playedDeck.length);
        await PlayedCardsDao.removePlayedCard(game.id, playedDeck[index].id)
        await DrawCardsDao.createDrawCard(playedDeck[index].id, game.id);
        playedDeck = playedDeck.filter((r,i) => i !== index);
      }
      const drawDeckCount = await DrawCardsDao.findCardCount(game.id);
      ret.update = true;
      ret.drawDeckCount = drawDeckCount;
    }
  }
  return ret;
}
async function emitDrawCards(game, player, io) {

  try {
    const newTurnIndex = await getNextTurn(game, false);

    const result = await handleDrawCards(game, player, 1);
  
    if (result.retval !== 1 || newTurnIndex === -1) return;
  
    let newGameState = {
      playerIndex: player.turnIndex,
      playerThatDrawsIndex: player.turnIndex,
      newTurnIndex: newTurnIndex,
      playerOrderReversed: game.playerOrderReversed,
      amount: 1
    };
    if (result.update) {
      newGameState.refreshDrawCards = true;
      newGameState.drawDeckCount = result.drawDeckCount;
    }
    io.to(`game/${game.id}`).emit('draw-card', newGameState);
  } catch (error) {
    console.log("Error in emit draw card", error)
  }
}

module.exports = {
  addToUserSockets,
  removeFromUserSockets,
  getSocketsFromUserSockets,
  splitLobbyMembers,
  broadcastUpdatedInvitationList,
  broadcastLobbyMembers,
  broadcastLobbyMemberJoin,
  broadcastLobbyMemberLeave,
  broadcastLobbyMemberKicked,
  emitBasedOnCardType,
  emitDrawCards
};
