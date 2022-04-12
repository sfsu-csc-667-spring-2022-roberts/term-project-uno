const express = require('express');
const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestsDao = require('../db/dao/lobbyGuests');
const UserDao = require('../db/dao/users');
const LobbyError = require('../helpers/error/LobbyError');
const { authenticate } = require('../lib/utils/token');

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
        console.log("hello!");
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
router.get('/:id', authenticate, async (req, res) => {
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

router.post("/:id/users", authenticate, async (req, res) => {
  const user = req.user.id;
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
    if(result.length + 2 > data[0].playerCapacity) {
      return res.status(400).json({ message: 'Lobby is full'});
    }
    for(let i = 0; i<result.length; i++) {
      if(result[i].userId == user) {
        return res.status(400).json({ message: 'Already in this lobby'});
      }
    }
    if(user == data[0].hostId) {
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

module.exports = router;