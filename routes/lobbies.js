const express = require('express');
const LobbyDao = require('../db/dao/lobbies');
const LobbyError = require('../helpers/error/LobbyError');
const { authenticate } = require('../lib/utils/token');

const router = express.Router();

/* Get list of available lobbies */
router.get('/', async (req, res) => {
  LobbyDao.findAllFreeLobbies()
  .then((results) => {
    console.log(results);
    res.json(results);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  })
});

/* Create a new lobby */
router.post('/', authenticate, async (req, res) => {

});

/* Get Lobby */
router.post('/:id', authenticate, async (req, res) => {

});

module.exports = router;