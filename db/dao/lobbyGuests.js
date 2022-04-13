const db = require('../index');
const bcrypt = require('bcrypt');

async function findLobbyGuests(guestId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, ['LobbyGuests', 'userId', guestId])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function getAllLobbyGuests() {
  return db.query(`
    SELECT *
    FROM $1:name`, [`LobbyGuests`])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllLobbyGuests(lobbyId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, [`LobbyGuests`, `lobbyId`, lobbyId])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function addGuest(guestId, lobbyId) {
  return db.any(`
    INSERT INTO $1:name($2:name, $3:name)
    VALUES($4, $5)
    RETURNING *`,['LobbyGuests', 'userId', 'lobbyId', guestId, lobbyId])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function removeGuest(guestId, id) {

}

async function verifyGuest(guestId, lobbyId) {
  return db.query(`
    SELECT * 
    FROM $1:name
    WHERE $2:name = $3 AND $4:name = $5
  `, ['LobbyGuests', 'userId', guestId, 'lobbyId', lobbyId])
  .then((results) => {
    if (results & results.length === 1) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  findLobbyGuests,
  findAllLobbyGuests,
  getAllLobbyGuests,
  addGuest,
  removeGuest,
  verifyGuest
};