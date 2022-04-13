const express = require('express');
const UserDao = require('../db/dao/users');
const UserError = require('../helpers/error/UserError');
const { generateToken, authenticate } = require('../lib/utils/token');
const { validateRegister, validateLogin, validateChangeUsername,
  validateChangePassword } = require('../lib/validation/users');

const router = express.Router();

/* Change user information */
router.patch('/', authenticate, async (req, res) => {
  if (req.body.username && req.body.password) {
    const { error } = validateChangeUsername(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const oldUsername = req.user.username;
    const newUsername = req.body.username;
    const { password } = req.body;

    UserDao.usernameExists(newUsername).then((uniqueName) => {
      if (uniqueName) {
        return UserDao.changeUsername(oldUsername, newUsername, password);
      } else throw new UserError('Username is already taken', 409);
    })
    .then((userId) => {
      if (userId > 0) {
        return res.status(204).send();
      } else throw new UserError('Could not change username. Try again later', 500);
    })
    .catch((err) => {
      if (err instanceof UserError) {
        return res.status(err.getStatus()).json({ message: err.getMessage() });
      }
      console.error(err);
      return res.status(500).json({ message: 'An unexpected error occured' });
    });
  } else {
    const { error } = validateChangePassword(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword === confirmNewPassword) {
      UserDao.changePassword(req.user.username, oldPassword, newPassword)
      .then((userId) => {
        if (userId > 0) {
          return res.status(204).send();
        } else throw new UserError('Could not change password. Try again later', 500);
      })
      .catch((err) => {
        if (err instanceof UserError) {
          return res.status(err.getStatus()).json({ message: err.getMessage() });
        }
        console.error(err);
        return res.status(500).json({ message: 'An unexpected error occrued' });
      })
    } else res.status(400).json({ message: 'New password and confirm password do not match'});
  }
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

/* Get authenticated user info */
router.get('/me', authenticate, async (req, res) => {
  res.redirect(`/${req.user.username}`);
});

module.exports = router;
