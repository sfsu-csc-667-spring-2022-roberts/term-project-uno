const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', {layout: false, title: 'Home'});
});

router.get('/login', (req, res) => {
  res.render('login', {layout: false, title: 'Login'});
});

router.get('/register', (req, res) => {
  res.render('register', {layout: false, title: 'Register'});
});

// /games/:id(\\d+) <-- use this after the lobby page is created
router.get('/games/:id(\\d+)', (req, res) => {
  res.render('game', {layout: false, title: `Game ${req.params.id}`});
});


module.exports = router;
 