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
    for(let i = 0; i<results.length;i++) {
      if(results[i].password) {
        results[i].type = "private";
      }
      else {
        results[i].type = "public";
      }
      delete results[i].password;
      await LobbyGuestsDao.findAllLobbyGuests(results[i].id)
      .then((lobbyGuests) => {
        results[i].guests = lobbyGuests;
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'An unexpected error occured' });
      })
      await UserDao.findUserById(results[i].hostId)
      .then((user) => {
        results[i].hostName = user.username;
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'An unexpected error occured' });
      })
    }
    // console.log(results);
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
router.post('/create', authenticate, async (req, res) => {
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

router.post("/join/:id", authenticate, async (req, res) => {
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