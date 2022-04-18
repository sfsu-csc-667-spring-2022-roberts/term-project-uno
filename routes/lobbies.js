const express = require('express');
const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestsDao = require('../db/dao/lobbyGuests');
const LobbyInvitationsDao = require('../db/dao/lobbyInvitations');
const UserDao = require('../db/dao/users');
const LobbyError = require('../helpers/error/LobbyError');
const { authenticate } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');

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
        res.redirect("/lobby/"+result.id);
      }
    })
    .catch((err) => {
      console.error("ERROR",err);
      res.status(500).json({ message: 'An unexpected error occured' });
    });
  }
  else {
    return LobbyDao.createPublic(hostId, lobbyName, maxPlayers)
    .then((result) => {
      if(result){
        res.redirect("/lobby/"+result.id);
      }
    })
    .catch((err) => {
      console.error("ERROR",err);
      res.status(500).json({ message: 'An unexpected error occured' });
    });
  }

});

/* Join Lobby */
router.post("/:id(\\d+)/users", authenticate, async (req, res) => {
  const user = req.user.id;
  const { id } = req.params;
  let data;
  LobbyDao.findLobby(id)
  .then((lobby) => {
    if(lobby.password) {
      lobby.type = "true";
    }
    else {
      lobby.type = "false";
    }
    delete lobby.password;
    data = lobby;

    return LobbyGuestsDao.findAllLobbyGuests(id);
  })
  .then((result) => {
    if(result.length + 2 > data.playerCapacity) {
      return res.status(400).json({ message: 'Lobby is full'});
    }
    for(let i = 0; i<result.length; i++) {
      if(result[i].userId == user) {
        return res.status(400).json({ message: 'Already in this lobby'});
      }
    }
    if(user == data.hostId) {
      return res.status(400).json({ message: 'Already in this lobby'});
    }
    return LobbyGuestsDao.addGuest(user,id)
    .then((result) => {
      if(result){
        res.redirect("/lobby/"+id);
      }
    })
  })
  .catch((err) => {
    console.error("ERROR",err);
    res.status(500).json({ message: 'An unexpected error occured' });
  });
});

/* Create invitation */
router.post('/:lobbyId(\\d+)/invitations', authenticate, async (req, res) => {
  const { error } = validateUsername(req.body);
  if (error) return res.status(400).json({ message: 'Invalid username' });

  const { username } = req.body;
  const { lobbyId } = req.params;

  LobbyDao.verifyHost(req.user.id, lobbyId)
  .then((isHost) => {
    if (isHost) {
      return UserDao.findUserByName(username);
    } else throw new LobbyError('Only the lobby host can create invitations', 401);
  })
  .then((invitee) => {
    if (invitee) {
      return LobbyInvitationsDao.create(invitee.id, lobbyId)
    } else throw new LobbyError('User was not found', 404);
  })
  .then((lobbyIdResult) => {
    if (lobbyIdResult > 0) {
      return res.status(204).send();
    } else throw new LobbyError('Unable to send invitation', 500);
  })
  .catch((err) => {
    if (err instanceof LobbyError) {
      return res.status(err.getStatus()).json({ message: err.getMessage() });
    }
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  })
});

router.delete('/:lobbyId(\\d+)/invitations', authenticate, (req, res) => {
  const { lobbyId } = req.params;

  LobbyInvitationsDao.removeUserInvitation(req.user.id, lobbyId)
  .then((removed) => {
    if (removed) return res.status(204).send();
    else throw new LobbyError('Invitation was not found', 404);
  })
  .catch((err) => {
    if (err instanceof LobbyError) {
      return res.status(err.getStatus()).json({ message: err.getMessage() });
    }
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  });
})

module.exports = router;