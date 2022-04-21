const express = require('express');
const IndexError = require('../helpers/error/IndexError');
const UserDao = require('../db/dao/users');
const { authenticate, verifyToken } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');
const { findLobby } = require('../db/dao/lobbies');
const { findAllLobbyGuests } = require('../db/dao/lobbyGuests');
const { findUsersInvitations } = require('../db/dao/lobbyInvitations');
const { findGameWithLobby } = require('../db/dao/games');
const { verifyUserInGame } = require('../db/dao/players');
const { formatAllLobbyInfo, calculateWinRate } = require('../lib/utils/index');

const router = express.Router();

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
    });
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
  try {
    const { lobbyId } = req.params;
    const requestedLobby = await findLobby(lobbyId);
  
    if(requestedLobby && !requestedLobby.busy) {
      const { hostId, name } = requestedLobby;
      const asyncTasks = await Promise.all([UserDao.findUserById(hostId), findAllLobbyGuests(lobbyId)]);
      const host = asyncTasks[0];
      const lobbyGuests = asyncTasks[1];
      const lobbyGuestTasks = [];
      const leftList = [];
      const rightList = [];
      const guests = [{
        host: true,
        username: host.username,
        avatar: host.pictureUrl,
        id: host.id,
      }];

      lobbyGuests.forEach((lobbyGuest) => {
        lobbyGuestTasks.push(UserDao.findUserById(lobbyGuest.userId));
      });

      const usersInfo = await Promise.all(lobbyGuestTasks);

      for(let i = 0; i < usersInfo.length; i++) {
        const guest = { 
          username: usersInfo[i].username, 
          avatar: usersInfo[i].pictureUrl,
          ready: lobbyGuests[i].userReady,
          id: lobbyGuests[i].userId
        };
        guests.push(guest);
      }

      while(guests.length < 10) {
        guests.push({ empty: true })
      }

      for(let i = 0; i < 5 && i < guests.length; i++) {
        leftList.push(guests[i]);
      }

      for(let i = 5; i < 10 && i < guests.length; i++) {
        rightList.push(guests[i]);
      }

      res.render('lobby', {
        layout: false,
        title:  `Uno Lobby #${lobbyId}`,
        lobbyId: lobbyId,
        lobbyName: name,
        leftList,
        rightList,
        isHost: req.user.id === hostId,
        user: req.user
      });
    } 
    else if (requestedLobby && requestedLobby.busy) {
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
router.get('/games/:id(\\d+)', authenticate, (req, res) => {
  verifyUserInGame(req.params.id, req.user.id)
  .then((isUserInGame) => {
    if (isUserInGame) {
      res.render('game', {layout: false, title: `Game ${req.params.id}`, user: req.user});
    } else res.redirect('/');
  })
});

module.exports = router;
 