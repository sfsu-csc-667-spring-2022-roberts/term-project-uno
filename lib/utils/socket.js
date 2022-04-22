const UserDao = require('../../db/dao/users');
const LobbyDao = require('../../db/dao/lobbies');
const LobbyGuestDao = require('../../db/dao/lobbyGuests');
const LobbyInvitationDao = require('../../db/dao/lobbyInvitations');
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

function splitLobbyMembers(lobbyMembers) {
  const leftList = [];
  const rightList = [];
  const emptyGuest = { empty: true };

  for (let i = 0; i < 5; i++) {
    if (i < lobbyMembers.length) {
      leftList.push(lobbyMembers[i]);
    } else leftList.push(emptyGuest);
  }

  for (let i = 0; i < 5; i++) {
    if (i + 5 < lobbyMembers.length) {
      rightList.push(lobbyMembers[i + 5]);
    } else rightList.push(emptyGuest);
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
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers);

  io.to(`lobby-guest/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({ leftList, rightList }));
  io.to(`lobby-host/${lobbyId}`).emit('lobby-update-guests', JSON.stringify({
    host: true, leftList, rightList, guestsReady
  }));
}

async function broadcastLobbyMemberJoin(io, userId, lobbyId) {
  const userInfo = await UserDao.findUserById(userId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers);
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
  const userInfo = await UserDao.findUserById(userId);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers);
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
  const kickedUser = await UserDao.findUserById(userId);
  const guestsReady = await LobbyGuestDao.verifyAllGuestsReady(lobbyId);
  const lobbyMembers = await LobbyDao.findAllMembers(lobbyId);
  const { leftList, rightList } = splitLobbyMembers(lobbyMembers);
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

module.exports = {
  addToUserSockets,
  removeFromUserSockets,
  getSocketsFromUserSockets,
  splitLobbyMembers,
  broadcastUpdatedInvitationList,
  broadcastLobbyMembers,
  broadcastLobbyMemberJoin,
  broadcastLobbyMemberLeave,
  broadcastLobbyMemberKicked
};
