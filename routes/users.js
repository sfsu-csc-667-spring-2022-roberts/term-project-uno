const express = require('express');
const UserDao = require('../db/dao/users');
const UserError = require('../helpers/error/UserError');
const { generateToken, authenticate } = require('../lib/utils/token');
const { validateRegister, validateLogin } = require('../lib/validation/users');


const router = express.Router();

/* Get authenticated user info */
router.get('/', authenticate, async (req, res) => {
  if (req.user) res.json({ user: req.user });
  else res.status(401).json();
});

/* User registration */
router.post('/', async (req, res) => {
  const { error } = validateRegister(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, password, confirmPassword } = req.body;
  UserDao.usernameExists(username).then((uniqueName) => {
    if (uniqueName) {
      if (password === confirmPassword) {
        return UserDao.create(username, password); 
      } else throw new UserError('Password and confirm password do not match', 400);
    } 
    else throw new UserError('Username is already taken', 409);
  })
  .then((userId) => {
    if (userId > 0) {
      return res.redirect('/login');
    } else throw new UserError('An error occured when creating the user', 500);
  })
  .catch((err) => {
    if (err instanceof UserError) {
      return res.status(err.getStatus()).json({ message: err.getMessage() });
    } 
    console.error(err);
    return res.status(500).json({ message: 'An unexpected error occured' });
  });
});

router.post('/login', async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, password } = req.body;
  UserDao.authenticate(username, password)
  .then((userId) => {
    if (userId > 0) {
      const token = generateToken(userId);
      res.cookie('token', token, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
      res.redirect('/');
    } else throw new UserError('Invalid username and/or password', 400);
  })
  .catch((err) => {
    if (err instanceof UserError) {
      return res.status(err.getStatus()).json({ message: err.getMessage() });
    }
    console.error(err);
    return res.status(500).json({ message: 'An unexpected error occured' });
  })
});

router.post('/logout', authenticate, async(req, res) => {
  res.cookie('token', '', { httpOnly: true, maxAge: 1});
  return res.json();
});

module.exports = router;
