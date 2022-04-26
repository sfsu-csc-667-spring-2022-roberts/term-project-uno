const express = require('express');
const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestsDao = require('../db/dao/lobbyGuests');
const LobbyInvitationDao = require('../db/dao/lobbyInvitations');
const UserDao = require('../db/dao/users');
const MessageDao = require('../db/dao/messages');
const LobbyError = require('../helpers/error/LobbyError');
const { authenticate } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');
const { getSocketsFromUserSockets, broadcastLobbyMemberJoin, broadcastLobbyMemberLeave, 
  broadcastLobbyMemberKicked, broadcastLobbyMembers, broadcastUpdatedInvitationList } = require('../lib/utils/socket');
const io = require('../socket/index');

const router = express.Router();

/* Get list of available lobbies with current player count*/
router.get('/', async (req, res) => {
  LobbyDao.findAllFreeLobbies()
  .then(async (results) => {
    const queries = [];

    results.forEach((result) => {
      if(result.password) {
        result.type = "private";
      }
      else {
        result.type = "public";
      }
      delete result.password;

      const formatLobbyInfo = async () => {
        const lobbyGuests = await LobbyGuestsDao.findAllLobbyGuests(result.id);
        const host = await UserDao.findUserById(result.hostId);
        result.guests = lobbyGuests;
        result.hostName = host.username;
      }
      queries.push(formatLobbyInfo());
    });

    await Promise.allSettled(queries);
    res.json(results);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  })
});

/* Get Lobby */
router.get('/:id(\\d+)', authenticate, async (req, res) => {
  const { id } = req.params;
  let data;

  LobbyDao.findLobby(id)
  .then((results) => {
    if(results[0].password) {
      results[0].type = "true";
    }
    else {
      results[0].type = "false";
    }
    delete results[0].password;
    data = results;

    return LobbyGuestsDao.findAllLobbyGuests(id);
  })
  .then((result) => {
    data[0].guests = result;
    return UserDao.findUserById(data[0].hostId);
  })
  .then((result) => {
    data[0].hostName = result.username;
    return res.json(data);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  });
});

/* Create a new lobby */
router.post('/', authenticate, async (req, res) => {
  const hostId = req.user.id;
  const { lobbyName, maxPlayers} = req.body;

  if(req.body.password) {
    const password = req.body.password;
    return LobbyDao.createPrivate(hostId, lobbyName, maxPlayers, password)
    .then((result) => {
      if(result){
        res.redirect("/lobbies/"+result.id);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'An unexpected error occured' });
    });
  }
  else {
    return LobbyDao.createPublic(hostId, lobbyName, maxPlayers)
    .then((result) => {
      if(result){
        res.redirect("/lobbies/"+result.id);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'An unexpected error occured' });
    });
  }
});

/* Get all messages */
router.get('/:lobbyId(\\d+)/messages', authenticate, async (req, res) => {
  try {
    if (!(await LobbyDao.verifyHostOrGuest(req.user.id, req.params.lobbyId))) {
      return res.status(401).json({ message: 'User is not part of the game' });
    }
    res.json({ messages: await MessageDao.findLobbyMessages(req.params.lobbyId)});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

/* Send lobby messasge */
router.post('/:lobbyId(\\d+)/messages', authenticate, async (req, res) => {
  const { lobbyId } = req.params;
  const { message } = req.body;

  try {
    if (!req.user || !(await LobbyDao.verifyHostOrGuest(req.user.id, lobbyId))) {
      return res.status(401).json({ message: 'You are not a member of the lobby' });
    }

    const messageObj = await MessageDao.createLobbyMessage(message, req.user.id, lobbyId);

    messageObj.sender = req.user.username;
    delete messageObj.userId;
    delete messageObj.lobbyId;

    io.to(`lobby/${lobbyId}`).emit('lobby-message-send', JSON.stringify(messageObj));

    res.status(201).json({ message: 'Successfully created new lobby message' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

/* Join lobby */
router.post('/:lobbyId(\\d+)/users', authenticate, async (req, res) => {
  const { lobbyId } = req.params;
  try {
    const lobby = await LobbyDao.findLobby(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby does not exist' });
    if (lobby.busy) return res.status(409).json({ message: 'Lobby is busy' });
    
    const lobbyGuests = await LobbyGuestsDao.findAllLobbyGuests(lobbyId);

    // Full Lobby
    if (lobbyGuests.length + 2 > lobby.playerCapacity) {
      return res.status(409).json({ message: 'Lobby is full' });
    }

    // Already a lobby member
    if (req.user.id == lobby.hostId) {
      return res.redirect(`/lobbies/${lobbyId}`);
    }
    for (let i = 0; i < lobbyGuests.length; i++) {
      if (req.user.id == lobbyGuests[i].userId) {
        return res.redirect(`/lobbies/${lobbyId}`);
      }
    }

    await LobbyGuestsDao.addGuest(req.user.id, lobbyId);
    await broadcastLobbyMemberJoin(io, req.user.id, lobbyId);
    res.redirect(`/lobbies/${lobbyId}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
});

/* Leave lobby */
router.delete('/:lobbyId(\\d+)/users', authenticate, async (req, res) => {
  const { lobbyId } = req.params;
  try {
    const lobby = await LobbyDao.findLobby(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    const userSockets = getSocketsFromUserSockets(req.user.id);
    /* If the host is leaving the lobby, then a new host must be assigned */
    if (req.user.id == lobby.hostId) {
      let nextHostId;
      try {
        nextHostId = await LobbyGuestsDao.removeOldestGuest(lobbyId);
      } catch (err) {
        // If there are no more guests, then delete the lobby
        await LobbyDao.deleteLobby(lobbyId);
        userSockets.forEach((userSocket) => {
          if (userSocket.rooms.has(`lobby/${lobbyId}`)) {
            userSocket.emit('redirect', JSON.stringify({ pathname: `/find-lobby` }));
          }
        })
        return res.json({ message: 'Successfully left the lobby' });
      }

      const nextHostSockets = getSocketsFromUserSockets(nextHostId);
      await LobbyDao.setHost(nextHostId, lobbyId);
      const guestsReady = await LobbyGuestsDao.verifyAllGuestsReady(lobbyId);
      nextHostSockets.forEach((hostSocket) => {
        if (hostSocket.rooms.has(`lobby-guest/${lobbyId}`)) {
          hostSocket.leave(`lobby-guest/${lobbyId}`);
          hostSocket.join(`lobby-host/${lobbyId}`)
          hostSocket.emit('upgrade-to-lobby-host', JSON.stringify({ guestsReady }));
        }
      });
    } else await LobbyGuestsDao.remove(req.user.id, lobbyId);

    userSockets.forEach((userSocket) => {
      if (userSocket.rooms.has(`lobby/${lobbyId}`)) {
        userSocket.emit('redirect', JSON.stringify({ pathname: `/find-lobby` }));
      }
    })

    broadcastLobbyMemberLeave(io, req.user.id, lobbyId);
    res.json({ message: 'Successfully left the lobby' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
});

/* Kick user from lobby */
router.delete('/:lobbyId(\\d+)/users/:userId(\\d+)', authenticate, async (req, res) => {
  const { lobbyId, userId } = req.params;
  try {
    if (!(await LobbyDao.findLobby(lobbyId))) {
      return res.status(404).json({ message: 'Cannot find lobby' });
    }
    if (!(await LobbyDao.verifyHost(req.user.id, lobbyId))) {
      return res.status(401).json({ message: 'You must be the host of the lobby to kick players' });
    }

    await LobbyGuestsDao.remove(userId, lobbyId);
    broadcastLobbyMemberKicked(io, req.user.username, userId, lobbyId);
    res.json({ message: 'Successfully kicked the player from the lobby' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
});

/* Toggle user ready */
router.patch('/:lobbyId(\\d+)/users', authenticate, async (req, res) => {
  const { lobbyId } = req.params;
  try {
    if (!(await LobbyGuestsDao.verifyGuest(req.user.id, lobbyId))) {
      return res.status(401).json({ message: 'You are not a guest in the lobby' });
    }

    await LobbyGuestsDao.toggleReady(req.user.id, lobbyId);
    broadcastLobbyMembers(io, lobbyId);
    res.json({ message: 'Toggled ready' });
  } catch (err) {
    console.error(err);
  }
});

/* Create invitation */
router.post('/:lobbyId(\\d+)/invitations', authenticate, async (req, res) => {
  const { error } = validateUsername(req.body);
  if (error) return res.status(400).json({ message: 'Invalid username' });

  const { username } = req.body;
  const { lobbyId } = req.params;

  try {
    if (!(await LobbyDao.verifyHost(req.user.id, lobbyId))) {
      return res.status(401).json({ message: 'You must be the host of the lobby to send invites' });
    }
    if (await UserDao.usernameExists(username)) {
      return res.status(404).json({ message: 'Cannot find user' });
    }

    const invitee = await UserDao.findUserByName(username);

    if (await LobbyDao.verifyHostOrGuest(invitee.id, lobbyId)) {
      return res.status(409).json({ message: 'This user is already in the lobby' });
    }

    if (await LobbyInvitationDao.checkInvitationExists(invitee.id, lobbyId)) {
      return res.status(409).json({ message: 'This user has already been invited' });
    }

    await LobbyInvitationDao.create(invitee.id, lobbyId);
    broadcastUpdatedInvitationList(io, invitee.id);
    res.status(201).json({ message: 'User successfully invited' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
});

/* Decline invitation */
router.delete('/:lobbyId(\\d+)/invitations', authenticate, async (req, res) => {
  const { lobbyId } = req.params;
  try {
    if (!(await LobbyInvitationDao.removeUserInvitation(req.user.id, lobbyId))) {
      return res.status(404).json({ message: 'Invitation was not found' });
    }
    broadcastUpdatedInvitationList(io, req.user.id);
    res.json({ message: 'Invitation successfully declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
})

/* Accept invitation */
router.delete('/:lobbyId(\\d+)/invitations/accept', authenticate, async (req, res) => {
  const { lobbyId } = req.params;
  try {
    const lobby = await LobbyDao.findLobby(lobbyId);
    if (!lobby) {
      await LobbyInvitationDao.removeUserInvitation(req.user.id, lobbyId);
      broadcastUpdatedInvitationList(io, req.user.id);
      return res.status(404).json({ message: 'The lobby no longer exists' });
    }

    if (lobby.busy) {
      await LobbyInvitationDao.removeUserInvitation(req.user.id, lobbyId);
      broadcastUpdatedInvitationList(io, req.user.id);
      return res.status(409).json({ message: 'The lobby is already in session' });
    }

    const lobbyGuests = await LobbyGuestsDao.findAllLobbyGuests(lobbyId);

    // Full Lobby
    if (lobbyGuests.length + 2 > lobby.playerCapacity) {
      await LobbyInvitationDao.removeUserInvitation(req.user.id, lobbyId);
      broadcastUpdatedInvitationList(io, req.user.id);
      return res.status(409).json({ message: 'The lobby is already full' });
    }

    // Already a lobby member
    if (req.user.id == lobby.hostId) {
      await LobbyInvitationDao.removeUserInvitation(req.user.id, lobbyId);
      broadcastUpdatedInvitationList(io, req.user.id);
      return res.redirect(`/lobbies/${lobbyId}`);
    }
    for (let i = 0; i < lobbyGuests.length; i++) {
      if (req.user.id == lobbyGuests[i].userId) {
        await LobbyInvitationDao.removeUserInvitation(req.user.id, lobbyId);
        broadcastUpdatedInvitationList(io, req.user.id);
        return res.redirect(`/lobbies/${lobbyId}`);
      }
    }

    await LobbyGuestsDao.addGuest(req.user.id, lobbyId);
    LobbyInvitationDao.removeUserInvitation(req.user.id, lobbyId);

    await broadcastLobbyMemberJoin(io, req.user.id, lobbyId);
    res.redirect(`/lobbies/${lobbyId}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
})

module.exports = router;