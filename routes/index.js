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

router.get('/profile', (req, res) => {
  res.render('profile', {layout: false, title: 'Profile'});
});

router.get('/user-settings', (req, res) => {
  res.render('user-settings', {layout: false, title: 'User Settings'});
});


router.get('/create-lobby', (req,res) => {
  res.render('create-lobby', {layout: false, title: 'Create Lobby'});
});

router.get('/find-lobby', (req,res) => {
  res.render('find-lobby', {layout: false, title: 'Find Lobby'});
});

module.exports = router;
 