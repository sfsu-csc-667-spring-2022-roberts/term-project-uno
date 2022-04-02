const express = require('express');
const { verifyToken } = require('../lib/utils/token');

const router = express.Router();

router.get('/', async (req, res) => {
  const { token } = req.cookies;
  const loggedIn = token && await verifyToken(token);

  res.render('home', {layout: false, title: 'Home', loggedIn});
});

router.get('/login', async (req, res) => {
  const { token } = req.cookies;
  const loggedIn = token && await verifyToken(token);

  res.render('login', {layout: false, title: 'Login', loggedIn});
});

router.get('/register', async (req, res) => {
  const { token } = req.cookies;
  const loggedIn = token && await verifyToken(token);

  res.render('register', {layout: false, title: 'Register', loggedIn});
});

module.exports = router;
 