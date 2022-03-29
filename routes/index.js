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

module.exports = router;
 