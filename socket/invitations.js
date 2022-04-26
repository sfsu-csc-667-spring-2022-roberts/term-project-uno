const UserDao = require('../db/dao/users');
const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestDao = require('../db/dao/lobbyGuests');
const LobbyInvitationDao = require('../db/dao/lobbyInvitations');
const { broadcastUpdatedInvitationList, broadcastLobbyMemberJoin } = require('../lib/utils/socket');

function initializeInvitationEndpoints(io, socket, user) {
  if (user) {
    try {
      const referer = socket.handshake.headers.referer;
      if (referer) {
        const requestUrl = new URL(referer);
        const pathnameSplit = requestUrl.pathname.split('/');
        if (pathnameSplit.length === 2 && pathnameSplit[1] === 'notifications') {
          socket.join(`notification/${user.id}`)
        }
      }
    } catch (err) {
      console.error('Error occured when attempting to join socket notification room\n', err);
    }
  }

  socket.on('invite-to-lobby', async (message) => {
    try {
      data = JSON.parse(message);

      if (!user || !(await LobbyDao.verifyHost(user.id, data.lobbyId))) return;

      if (await UserDao.usernameExists(data.username)) {
        return socket.emit('invite-to-lobby', JSON.stringify({ error: true, message: 'Cannot find user' }));
      }

      const invitee = await UserDao.findUserByName(data.username);

      if (await LobbyDao.verifyHostOrGuest(invitee.id, data.lobbyId)) {
        return socket.emit('invite-to-lobby', JSON.stringify({ error: true, message: 'This user is already in the lobby' }));
      }

      if (await LobbyInvitationDao.checkInvitationExists(invitee.id, data.lobbyId)) {
        return socket.emit('invite-to-lobby', JSON.stringify({ error: true, message: 'This user has already been invited' }));
      }

      await LobbyInvitationDao.create(invitee.id, data.lobbyId);

      broadcastUpdatedInvitationList(io, invitee.id);
      socket.emit('invite-to-lobby', JSON.stringify({ message: 'User successfully invited' }));
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('accept-invite', async (message) => {
    try {
      data = JSON.parse(message);

      const lobby = await LobbyDao.findLobby(data.lobbyId);
      if (!lobby) {
        await LobbyInvitationDao.removeUserInvitation(user.id, data.lobbyId);
        broadcastUpdatedInvitationList(io, user.id);
        return socket.emit('invite-error', JSON.stringify({ message: 'The lobby no longer exists' }));
      }

      if (lobby.busy) {
        await LobbyInvitationDao.removeUserInvitation(user.id, data.lobbyId);
        broadcastUpdatedInvitationList(io, user.id);
        return socket.emit('invite-error', JSON.stringify({ message: 'The lobby is already in-session' }));
      }

      const lobbyGuests = await LobbyGuestDao.findAllLobbyGuests(data.lobbyId);

      // Full Lobby
      if (lobbyGuests.length + 2 > lobby.playerCapacity) {
        await LobbyInvitationDao.removeUserInvitation(user.id, data.lobbyId);
        broadcastUpdatedInvitationList(io, user.id);
        return socket.emit('invite-error', JSON.stringify({ message: 'The lobby is already full' }));
      }

      // Already a lobby member
      if (user.id == lobby.hostId) {
        await LobbyInvitationDao.removeUserInvitation(user.id, data.lobbyId);
        broadcastUpdatedInvitationList(io, user.id);
        return socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
      }
      for (let i = 0; i < lobbyGuests.length; i++) {
        if (user.id == lobbyGuests[i].userId) {
          await LobbyInvitationDao.removeUserInvitation(user.id, data.lobbyId);
          broadcastUpdatedInvitationList(io, user.id);
          return socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
        }
      }

      await LobbyGuestDao.addGuest(user.id, data.lobbyId);
      LobbyInvitationDao.removeUserInvitation(user.id, data.lobbyId);

      await broadcastLobbyMemberJoin(io, user.id, data.lobbyId);
      socket.emit('redirect', JSON.stringify({ pathname: `/lobbies/${data.lobbyId}` }));
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('decline-invite', async (message) => {
    try {
      data = JSON.parse(message);

      if (!user) return;

      await LobbyInvitationDao.removeUserInvitation(user.id, data.lobbyId);
      broadcastUpdatedInvitationList(io, user.id);
    } catch (err) {
      console.error(err);
    }
  })
}

module.exports = { initializeInvitationEndpoints };