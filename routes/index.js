const express = require('express');
const IndexError = require('../helpers/error/IndexError');
const { authenticate, verifyToken } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');
const { findUserByName, findUserBySimilarName, findUserById } = require('../db/dao/users');
const { findLobby } = require('../db/dao/lobbies');
const { findAllLobbyGuests } = require('../db/dao/lobbyGuests');
const object = require('@hapi/joi/lib/types/object');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  const authenticated = req.user != undefined;

  res.render('home', {layout: false, title: 'Home', authenticated, user: req.user });
});

router.get('/login', verifyToken, async (req, res) => {
  const authenticated = req.user != undefined;

  res.render('login', {layout: false, title: 'Login', authenticated, user: req.user});
});

router.get('/register', verifyToken, async (req, res) => {
  const authenticated = req.user != undefined;

  res.render('register', {layout: false, title: 'Register', authenticated, user: req.user});
});

router.get('/search', verifyToken, async (req, res) => {
  const authenticated = req.user != undefined;
  const { q } = req.query;
  const title = q ? `Search "${q}"` : `Search`;
  let results;

  if (q) results = await findUserBySimilarName(q);

  res.render('search', { layout: false, title, authenticated, user: req.user, results, q});
});

router.get('/settings', authenticate, (req, res) => {
  const authenticated = req.user != undefined;

  res.render('settings', {layout: false, title: 'User Settings', authenticated, user: req.user});
});

router.get('/create-lobby', authenticate, (req,res) => {
  const authenticated = req.user != undefined;

  res.render('create-lobby', {layout: false, title: 'Create Lobby', authenticated, user: req.user});
});

router.get('/lobby', authenticate, (req,res) => {
  const authenticated = req.user != undefined;

  res.render('lobby', {layout: false, title: 'Lobby', authenticated, user: req.user});
});

router.get('/find-lobby', verifyToken, (req,res) => {
  const authenticated = req.user != undefined;

  res.render('find-lobby', {layout: false, title: 'Find Lobby', authenticated, user: req.user});
});

/* Users' profile pages */
router.get('/:username', verifyToken, async (req, res, next) => {
  const { error } = validateUsername(req.params);
  if (error) {  
    // if username is invalid format then assume the requested resource is not a user
    const indexError = new IndexError('This page does not exist', 404);
    return next(indexError);
  }

  const { username } = req.params;
  const authenticated = req.user != undefined;
  const requestedUser = await findUserByName(username);

  if (!requestedUser) {
    return next(new IndexError('Cannot find user "' + username + '"', 404));
  }
  
  const { gamesPlayed, gamesWon } = requestedUser;
  const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed).toFixed(4) * 100 : 0;
  requestedUser['winRate'] = winRate;

  res.render('profile', {
    layout: false,
    title: username,
    user: req.user,
    authenticated,
    requestedUser,
  });
});

router.get('/lobby/:lobbyId', verifyToken, async (req, res, next) => {
  const { lobbyId } = req.params;
  const requestedLobby = await findLobby(lobbyId);

  if(requestedLobby) {
    const { hostId, name, playerCapacity, busy } = requestedLobby[0];
    const host = await findUserById(hostId);
    const hostName = host.username;
    const lobbyGuests = await findAllLobbyGuests(lobbyId);
    let guestAndStatus = []
    for(let i = 0; i<lobbyGuests.length; i++) {
      const guest = await findUserById(lobbyGuests[i].userId)
      object["username"] = guest.username
      object["ready"] = lobbyGuests[i].userReady;
      guestAndStatus.push(object);
    }
    console.log(req.user.id == hostId);

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
    });
  }
  


});

router.get('/games/:id(\\d+)', verifyToken, (req, res) => {
  const authenticated = req.user != undefined;
  if (!authenticated) res.redirect("/login");
  else res.render('game', {layout: false, title: `Game ${req.params.id}`, authenticated, user: req.user});
});


module.exports = router;
 