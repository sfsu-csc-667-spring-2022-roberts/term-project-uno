const express = require('express');
const { verifyToken } = require('../lib/utils/token');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  const authenticated = req.user != undefined;

  res.render('home', {layout: false, title: 'Home', authenticated, user: req.user });
});

router.get('/login', async (req, res) => {
  const authenticated = req.user != undefined;

  res.render('login', {layout: false, title: 'Login', authenticated});
});

router.get('/register', async (req, res) => {
  const authenticated = req.user != undefined;

  res.render('register', {layout: false, title: 'Register', authenticated});
});

module.exports = router;
 