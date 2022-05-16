const express = require('express');
const IndexError = require('../helpers/error/IndexError');
const UserDao = require('../db/dao/users');
const { authenticate, verifyToken } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');
const { findLobby, findAllMembers, verifyHostOrGuest } = require('../db/dao/lobbies');
const { verifyAllGuestsReady } = require('../db/dao/lobbyGuests');
const { checkUserHasInvitations } = require('../db/dao/lobbyInvitations');
const { findGameWithLobby } = require('../db/dao/games');
const { verifyUserInGame } = require('../db/dao/players');
const { calculateWinRate, timeSince } = require('../lib/utils/index');
const { splitLobbyMembers } = require('../lib/utils/socket');

const router = express.Router();

router.get('/leaderboard', verifyToken, async (req, res, next) => {
  try {
    res.render('leaderboard', {
      layout: false, 
      title: 'Leaderboard',
      users: await UserDao.getScores(),
      user: req.user,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/', verifyToken, async (req, res, next) => {
  if (req.user) {
    try {
      const results = await Promise.all([
        UserDao.findAllFormattedLobbies(req.user.id), checkUserHasInvitations(req.user.id)
      ]);
      const lobbies = results[0];

      res.render('home', {
        layout: false, title: 'Home', 
        user: req.user, lobbies,
        notifications: results[1]
      });
    } catch (err) {
      console.error(err);
      next(new IndexError('An unexpected error occured', 500));
    }
  } else res.render('home', {layout: false, title: 'Home'});
});

router.get('/login', verifyToken, async (req, res, next) => {
  try {
    res.render('login', {
      layout: false, title: 'Login', user: req.user,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/register', verifyToken, async (req, res, next) => {
  try {
    res.render('register', {
      layout: false, title: 'Register', user: req.user,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const results = await Promise.all([
      UserDao.findInvitations(req.user.id), checkUserHasInvitations(req.user.id)
    ]);
    const lobbyInvitations = results[0];
    const invitations = [];
  
    lobbyInvitations.forEach((invitation) => {
      invitations.push({
        lobbyId: invitation.lobbyId,
        lobbyName: invitation.lobbyName,
        createdAt: invitation.createdAt,
        timeSince: timeSince(new Date(invitation.createdAt))
      });
    });

    res.render('notifications', { 
      layout: false, title: 'Notifications', user: req.user, invitations,
      notifications: results[1]
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/search', verifyToken, async (req, res, next) => {
  try {
    const { q } = req.query;
    const title = q ? `Search "${q}"` : `Search`;
    const asyncTasks = await Promise.all([
      q != '' ? UserDao.findUsersBySimilarName(q) : null,
      req.user ? (checkUserHasInvitations(req.user.id)) : false
    ]);
    const results = asyncTasks[0];

    res.render('search', { 
      layout: false, title, user: req.user, results, q, 
      notifications: asyncTasks[1]
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/settings', authenticate, async (req, res) => {
  try {
    res.render('settings', {
      layout: false, title: 'User Settings', user: req.user,
      notifications: await checkUserHasInvitations(req.user.id)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/create-lobby', authenticate, async (req,res) => {
  try {
    res.render('create-lobby', {
      layout: false, title: 'Create Lobby', user: req.user,
      notifications: await checkUserHasInvitations(req.user.id)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/find-lobby', verifyToken, async (req,res) => {
  try {
    res.render('find-lobby', {
      layout: false, title: 'Find Lobby', user: req.user,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

/* Profile pages */
router.get('/:username', verifyToken, async (req, res, next) => {
  const { error } = validateUsername(req.params);
  if (error) return next(new IndexError('This page does not exist', 404));

  try {
    const { username } = req.params;
    const results = await Promise.all([
      UserDao.findUserByName(username), (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    ]);
    const requestedUser = results[0];

    if (!requestedUser) return next(new IndexError(`Cannot find user "${username}"`, 404));
    requestedUser['winRate'] = calculateWinRate(requestedUser);

    res.render('profile', { 
      layout: false, title: username, user: req.user, requestedUser, 
      notifications: results[1]
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

/* Lobby Pages */
router.get('/lobbies/:lobbyId(\\d+)', authenticate, async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    if (!(await verifyHostOrGuest(req.user.id, lobbyId))) return res.redirect('/find-lobby');

    const lobby = await findLobby(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });
  
    if(lobby && !lobby.busy) {
      const results = await Promise.all([
        findAllMembers(lobbyId), verifyAllGuestsReady(lobbyId), checkUserHasInvitations(req.user.id)
      ]);
      const lobbyMembers = results[0];
      const guestsReady = results[1];
      const list = splitLobbyMembers(lobbyMembers, lobby.playerCapacity);

      res.render('lobby', {
        layout: false, title:  `Uno Lobby #${lobbyId}`, lobbyId, maxPlayers: lobby.playerCapacity,
        lobbyName: lobby.name, list, guestsReady, isHost: req.user.id === lobby.hostId,
        isPrivate: lobby.password != null, user: req.user, notifications: results[2]
      });
    } 
    else if (lobby && lobby.busy) {
      const game = await findGameWithLobby(lobbyId)
      res.redirect(`/games/${game.id}`);
    }
    else res.redirect('/');
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

/* Game Pages */
router.get('/games/:id(\\d+)', authenticate, async (req, res, next) => {
  try {
    const isPlayer = await verifyUserInGame(req.params.id, req.user.id);
    if (!isPlayer) return res.redirect('/');
    res.render('game', {layout: false, title: `Game ${req.params.id}`, user: req.user});
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

module.exports = router;
 