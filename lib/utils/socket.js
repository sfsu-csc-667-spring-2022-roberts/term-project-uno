const UserDao = require('../../db/dao/users');
const LobbyDao = require('../../db/dao/lobbies');
const LobbyGuestDao = require('../../db/dao/lobbyGuests');
const LobbyInvitationDao = require('../../db/dao/lobbyInvitations');
const GamesDao = require("../../db/dao/games");
const PlayersDao = require("../../db/dao/players");
const PlayedCardsDao = require("../../db/dao/playedCards");
const PlayerCardsDao = require("../../db/dao/playerCards");
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

  return { leftList, rightList };
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
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({
    host: true, leftList, rightList, guestsReady
  }));
}

async function broadcastLobbyMemberJoin(io, userId, lobbyId) {
  const lobby = await LobbyDao.findLobby(lobbyId);
  const userInfo = await UserDao.findUserById(userId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const notification = {
    notification: true,
    message: `${userInfo.username} joined the lobby`,
    createdAt: (new Date()).toISOString()
  };

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({
    host: true, leftList, rightList, guestsReady
  }));
  io.to(`lobby/${lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
}

async function broadcastLobbyMemberLeave(io, userId, lobbyId) {
  const lobby = await LobbyDao.findLobby(lobbyId);
  const userInfo = await UserDao.findUserById(userId);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);
  const notification = {
    notification: true,
    message: `${userInfo.username} left the lobby`,
    createdAt: (new Date()).toISOString()
  };

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({
    host: true, leftList, rightList, guestsReady
  }));
  io.to(`lobby/${lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
}

async function broadcastLobbyMemberKicked(io, hostname, userId, lobbyId) {
  const lobby = await LobbyDao.findLobby(lobbyId);
  const kickedUser = await UserDao.findUserById(userId);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);
  const notification = {
    notification: true,
    message: `${hostname} kicked ${kickedUser ? kickedUser.username : 'Deleted User'} from the lobby`,
    createdAt: (new Date()).toISOString()
  }

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-kick-player', JSON.stringify({ leftList, rightList }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-kick-player', JSON.stringify({
    host: true, leftList, rightList, guestsReady
  }));
  io.to(`lobby/${lobbyId}`).emit('lobby-message-send', JSON.stringify(notification));
}

async function handleSkip(game, card) {
  // change turn index
  return {}
}
async function handleReverse(game, card) {
  // change playerOrderReversed
  return {}
}
async function handlePlus2(game, card) {
  // add 2 cards to the player's deck
  return {}
}
async function handlePlus4Choose(game, card) {
  // change current color and add 4 to the player's deck
  console.log("GAME", game, "CARD", card);
  return {}
}
async function handleChoose(game, card) {
  // change current color
  return {}
}
async function handleSwap(game, card) {
  // swap cards
  return {}
}
async function handleNumber(game, player, card) {
  console.log("GAME", game, "CARD", card, "PLAYER", player);
  // const result1 = await PlayerCardsDao.removePlayerCard(card.id, player.id);
  // const result2 = await PlayedCardsDao.createPlayedCard(card.id, game.id);
  // if (!result1 || !result2) return { fail: true };

  return { card };
}
async function getNextTurn(game) {
  // let count = await PlayersDao.findPlayersCount(game.id);
  // let newTurnIndex;

  // if (count === -1) return;

  // if (game.playerOrderReversed) {
  //     if (game.turnIndex === 0) newTurnIndex = count - 1;
  //     else newTurnIndex = game.turnIndex - 1;
  // } else {
  //     if (game.turnIndex === count - 1) newTurnIndex = 0;
  //     else newTurnIndex = game.turnIndex + 1;
  // }


  console.log("REZZULTT", result);
}

async function emitBasedOnCardType(game, player, card, io) {
  let newData;
  if (card.special) {
      switch (card.value) {
          case "skip": { newData = await handleSkip(game, player, card); break; }
          case "reverse": { newData = await handleReverse(game, player, card); break; }
          case "plus2": { newData = await handlePlus2(game, player, card); break; }
          case "plus4choose": { newData = await handlePlus4Choose(game, player, card); break; }
          case "choose": { newData = await handleChoose(game, player, card); break; }
          case "swap": { newData = await handleSwap(game, player, card); break; }
          default: return;
      }
      if (newData.fail) return;
      io.to(`game/${game.id}`).emit(`play-card-${card.value}`, newData);
  } else {
      newData = await handleNumber(game, player, card);
      if (newData.fail) return;
      // await getNextTurn(game);

      io.to(`game/${game.id}`).emit('play-card-number', newData);
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
  emitBasedOnCardType
};
