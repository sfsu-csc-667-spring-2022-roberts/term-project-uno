const express = require('express');
const object = require('@hapi/joi/lib/types/object');

const IndexError = require('../helpers/error/IndexError');
const UserDao = require('../db/dao/users');
const { authenticate, verifyToken } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');
const { findLobby } = require('../db/dao/lobbies');
const { findAllLobbyGuests } = require('../db/dao/lobbyGuests');
const { findUsersInvitations } = require('../db/dao/lobbyInvitations');
const router = express.Router();

async function formatLobbyInfo(lobby) {
  const results = await Promise.allSettled([findAllLobbyGuests(lobby.id), UserDao.findUserById(lobby.hostId)]);
  const lobbyGuests = results[0].value;
  const host = results[1].value;
  return {
    id: lobby.id,
    name: lobby.name,
    guestLength: lobbyGuests ? lobbyGuests.length : 0,
    hostName: host.username ? host.username : "",
    busy: lobby.busy,
    playerCapacity: lobby.playerCapacity,
    createdAt: lobby.createdAt
  };
}

async function formatAllLobbyInfo(lobbies) {
  const asyncTasks = [];
  if (lobbies) {
    lobbies.forEach((lobby) => {
      asyncTasks.push(formatLobbyInfo(lobby));
    })
  }

  const results = await Promise.allSettled(asyncTasks);
  return results.map((result) => {
    if (result.status === 'fulfilled') return result.value;
  });
}

function calculateWinRate(user) {
  const { gamesPlayed, gamesWon } = user;
  return gamesPlayed > 0 ? (gamesWon / gamesPlayed).toFixed(4) * 100 : 0;
}

router.get('/', verifyToken, (req, res) => {
  if (req.user) {
    UserDao.findAllLobbies(req.user.id)
    .then((lobbies) => {
      return formatAllLobbyInfo(lobbies);
    })
    .then((formattedLobbies) => {
      res.render('home', {layout: false, title: 'Home', user: req.user, lobbies: formattedLobbies});
    })
    .catch((err) => {
      console.error(err);
      next(new IndexError('An unexpected error occured', 500));
    })
  } else res.render('home', {layout: false, title: 'Home'});
});

router.get('/login', verifyToken, (req, res) => {
  res.render('login', {layout: false, title: 'Login', user: req.user});
});

router.get('/register', verifyToken, (req, res) => {
  res.render('register', {layout: false, title: 'Register', user: req.user});
});

router.get('/notifications', authenticate, (req, res, next) => {
  findUsersInvitations(req.user.id)
  .then((results) => {
    res.render('notifications', { layout: false, title: 'Notifications', user: req.user, results });
  })
  .catch((err) => {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  })
});

router.get('/search', verifyToken, (req, res, next) => {
  const { q } = req.query;
  const title = q ? `Search "${q}"` : `Search`;

  UserDao.findUserBySimilarName(q)
  .then((results) => {
    res.render('search', { layout: false, title, user: req.user, results, q});
  })
  .catch((err) => {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  });
});

router.get('/settings', authenticate, (req, res) => {
  res.render('settings', {layout: false, title: 'User Settings',  user: req.user});
});

router.get('/create-lobby', authenticate, (req,res) => {
  res.render('create-lobby', {layout: false, title: 'Create Lobby', user: req.user});
});

router.get('/find-lobby', verifyToken, (req,res) => {
  res.render('find-lobby', {layout: false, title: 'Find Lobby', user: req.user});
});

/* Profile pages */
router.get('/:username', verifyToken, async (req, res, next) => {
  const { error } = validateUsername(req.params);
  if (error) return next(new IndexError('This page does not exist', 404));

  const { username } = req.params;

  UserDao.findUserByName(username)
  .then((requestedUser) => {
    if (requestedUser) {
      requestedUser['winRate'] = calculateWinRate(requestedUser);
      res.render('profile', { layout: false, title: username, user: req.user, requestedUser });
    } else next(new IndexError('Cannot find user "' + username + '"', 404));
  })  
  .catch((err) => {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  });
});

/* Lobby Pages */
router.get('/lobby/:lobbyId(\\d+)', authenticate, async (req, res, next) => {
  const { lobbyId } = req.params;
  const requestedLobby = await findLobby(lobbyId);

  if(requestedLobby) {
    const { hostId, name, playerCapacity, busy } = requestedLobby[0];
    const host = await UserDao.findUserById(hostId);
    const hostName = host.username;
    const lobbyGuests = await findAllLobbyGuests(lobbyId);
    let guestAndStatus = []
    
    for(let i = 0; i<lobbyGuests.length; i++) {
      const guest = await UserDao.findUserById(lobbyGuests[i].userId)
      const guestObject = {"username":guest.username, "ready": lobbyGuests[i].userReady}
      guestAndStatus.push(guestObject);
    }

    res.render('lobby', {
      layout: false,
      title:  "Uno Lobby #"+lobbyId,
      lobbyId: lobbyId,
      lobbyName: name,
      currentPlayers: lobbyGuests.length + 1,
      maxCount: playerCapacity,
      hostName: hostName,
      hostId: hostId,
      guest: guestAndStatus,
      isHost: req.user.id == hostId,
      user: req.user
    });
  } else res.redirect('/');
});

/* Game Pages */
router.get('/games/:id(\\d+)', authenticate, (req, res) => {
  res.render('game', {layout: false, title: `Game ${req.params.id}`, user: req.user});
});

module.exports = router;
 