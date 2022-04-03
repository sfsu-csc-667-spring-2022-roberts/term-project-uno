const express = require('express');
const IndexError = require('../helpers/error/IndexError');
const { verifyToken } = require('../lib/utils/token');
const { validateUsername } = require('../lib/validation/users');
const { findUserByName } = require('../db/dao/users');

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

router.get('/settings', verifyToken, (req, res) => {
  const authenticated = req.user != undefined;

  res.render('settings', {layout: false, title: 'User Settings', authenticated, user: req.user});
});


router.get('/create-lobby', (req,res) => {
  const authenticated = req.user != undefined;

  res.render('create-lobby', {layout: false, title: 'Create Lobby', authenticated, user: req.user});
});

router.get('/find-lobby', (req,res) => {
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
  
  res.render('profile', {
    layout: false,
    title: username,
    user: req.user,
    authenticated,
    requestedUser,
  });
});

// /games/:id(\\d+) <-- use this after the lobby page is created
router.get('/games/:id(\\d+)', (req, res) => {
  res.render('game', {layout: false, title: `Game ${req.params.id}`});
});


module.exports = router;
 