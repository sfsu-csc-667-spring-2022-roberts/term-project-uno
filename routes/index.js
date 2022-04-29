const express = require('express');
const IndexError = require('../helpers/error/IndexError');
const UserDao = require('../db/dao/users');
const AvatarDao = require('../db/dao/avatars');
const { authenticate, verifyToken } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');
const { findLobby, findAllMembers, verifyHostOrGuest } = require('../db/dao/lobbies');
const { verifyAllGuestsReady } = require('../db/dao/lobbyGuests');
const { checkUserHasInvitations, findUsersInvitations } = require('../db/dao/lobbyInvitations');
const { findGameWithLobby } = require('../db/dao/games');
const { verifyUserInGame } = require('../db/dao/players');
const { formatAllLobbyInfo, calculateWinRate, timeSince } = require('../lib/utils/index');
const { splitLobbyMembers } = require('../lib/utils/socket');

const router = express.Router();

router.get('/', verifyToken, async (req, res, next) => {
  if (req.user) {
    try {
      const lobbies = await UserDao.findAllLobbies(req.user.id);
      const formattedLobbies = await formatAllLobbyInfo(lobbies);
      const avatar = await AvatarDao.find(req.user.avatar);
      const portrait = avatar ? avatar.height > avatar.width : true;
  
      res.render('home', {
        layout: false, title: 'Home', 
        user: req.user, lobbies: formattedLobbies, portrait,
        notifications: await checkUserHasInvitations(req.user.id)
      });
    } catch (err) {
      console.error(err);
      next(new IndexError('An unexpected error occured', 500));
    }
  } else res.render('home', {layout: false, title: 'Home'});
});

router.get('/login', verifyToken, async (req, res, next) => {
  try {
    const avatar = req.user ? await AvatarDao.find(req.user.avatar) : null;
    const portrait = avatar ? avatar.height > avatar.width : true;

    res.render('login', {
      layout: false, title: 'Login', user: req.user, portrait,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/register', verifyToken, async (req, res, next) => {
  try {
    const avatar = req.user ? await AvatarDao.find(req.user.avatar) : null;
    const portrait = avatar ? avatar.height > avatar.width : true;
  
    res.render('register', {
      layout: false, title: 'Register', user: req.user, portrait,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const lobbyInvitations = await findUsersInvitations(req.user.id);
    const avatar = await AvatarDao.find(req.user.avatar);
    const portrait = avatar ? avatar.height > avatar.width : true;
    const asyncTasks = [];
    const invitations = [];
  
    if (lobbyInvitations) {
      lobbyInvitations.forEach((invitation) => {
        asyncTasks.push(findLobby(invitation.lobbyId));
      });
  
      const lobbiesInfo = await Promise.all(asyncTasks);
  
      for (let i = 0; i < lobbiesInfo.length; i++) {
        invitations.push({
          lobbyId: lobbyInvitations[i].lobbyId,
          lobbyName: lobbiesInfo[i].name,
          createdAt: lobbyInvitations[i].createdAt,
          timeSince: timeSince(new Date(lobbyInvitations[i].createdAt))
        });
      }
    }
  
    res.render('notifications', { 
      layout: false, title: 'Notifications', user: req.user, invitations,
      portrait, notifications: await checkUserHasInvitations(req.user.id)
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
    const searchResults = await UserDao.findUserBySimilarName(q);
    const avatar = req.user ? await AvatarDao.find(req.user.avatar) : null;
    const portrait = avatar ? avatar.height > avatar.width : true;
    const users = [];
    const asyncTasks = [];

    searchResults.forEach((result) => {
      if (result.avatar) asyncTasks.push(AvatarDao.find(result.avatar));
      else asyncTasks.push(null);
    });

    const results = await Promise.allSettled(asyncTasks);
    
    for (let i = 0; i < asyncTasks.length; i++) {
      const user = searchResults[i];
      if (results[i].status === 'fulfilled' && results[i].value) {
        const resAvatar = results[i].value;
        user.portrait = resAvatar.height > resAvatar.width;
      }
      users.push(user);
    }

    res.render('search', { 
      layout: false, title, user: req.user, results: users, q, portrait,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/settings', authenticate, async (req, res) => {
  try {
    const avatar = await AvatarDao.find(req.user.avatar);
    const portrait = avatar ? avatar.height > avatar.width : true;

    res.render('settings', {
      layout: false, title: 'User Settings', user: req.user, portrait,
      notifications: await checkUserHasInvitations(req.user.id)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/create-lobby', authenticate, async (req,res) => {
  try {
    const avatar = await AvatarDao.find(req.user.avatar);
    const portrait = avatar ? avatar.height > avatar.width : true;
  
    res.render('create-lobby', {
      layout: false, title: 'Create Lobby', user: req.user, portrait,
      notifications: await checkUserHasInvitations(req.user.id)
    });
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

router.get('/find-lobby', verifyToken, async (req,res) => {
  try {
    const avatar = req.user ? await AvatarDao.find(req.user.avatar) : null;
    const portrait = avatar ? avatar.height > avatar.width : true;
  
    res.render('find-lobby', {
      layout: false, title: 'Find Lobby', user: req.user, portrait,
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
    const avatar = req.user ? await AvatarDao.find(req.user.avatar) : null;
    const portrait = avatar ? avatar.height > avatar.width : true;
    const { username } = req.params;
  
    const user = await UserDao.findUserByName(username);
    if (!user) return next(new IndexError(`Cannot find user "${username}"`, 404));
    const userAvatar = await AvatarDao.find(user.avatar);
    const userPortrait = userAvatar ? userAvatar.height > userAvatar.width : true;
    user['winRate'] = calculateWinRate(user);

    res.render('profile', { 
      layout: false, title: username, user: req.user, requestedUser: user, portrait, userPortrait,
      notifications: (req.user ? (await checkUserHasInvitations(req.user.id)) : false)
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

    const avatar = await AvatarDao.find(req.user.avatar);
    const portrait = avatar ? avatar.height > avatar.width : true;
    const lobby = await findLobby(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });
  
    if(lobby && !lobby.busy) {
      const { hostId, name } = lobby;
      const lobbyMembers = await findAllMembers(lobbyId);
      const guestsReady = await verifyAllGuestsReady(lobbyId);
      const { leftList, rightList } = splitLobbyMembers(lobbyMembers);

      res.render('lobby', {
        layout: false, title:  `Uno Lobby #${lobbyId}`, lobbyId: lobbyId, portrait,
        lobbyName: name, leftList, rightList, guestsReady, isHost: req.user.id === hostId,
        user: req.user, notifications: await checkUserHasInvitations(req.user.id)
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

    const avatar = await AvatarDao.find(req.user.avatar);
    const portrait = avatar ? avatar.height > avatar.width : true;
    res.render('game', {layout: false, title: `Game ${req.params.id}`, user: req.user, portrait});
  } catch (err) {
    console.error(err);
    next(new IndexError('An unexpected error occured', 500));
  }
});

module.exports = router;
 