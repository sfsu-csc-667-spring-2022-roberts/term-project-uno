const db = require('../index');
const bcrypt = require('bcrypt');

async function findLobbyGuests(guestId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, ['LobbyGuests', 'userId', guestId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
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

async function remove(guestId, lobbyId) {
  return db.one(`
    DELETE FROM "LobbyGuests"
    WHERE "userId" = $1 AND "lobbyId" = $2
    RETURNING *`, [guestId, lobbyId])
  .catch((err) => Promise.reject(err));
}

async function verifyGuest(guestId, lobbyId) {
  return db.query(`
    SELECT "userId" 
    FROM "LobbyGuests"
    WHERE "userId" = $1 AND "lobbyId" = $2
  `, [guestId, lobbyId])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function removeOldestGuest(lobbyId) {
  return db.any(`
    DELETE
    FROM "LobbyGuests"
    WHERE "userId" IN
      (SELECT "userId"
       FROM "LobbyGuests"
       WHERE "lobbyId" = $1
       LIMIT 1)
    RETURNING "userId"
  `, [lobbyId])
  .then((lobbyGuests) => {
    return Promise.resolve(lobbyGuests[0].userId);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  findLobbyGuests,
  findAllLobbyGuests,
  getAllLobbyGuests,
  addGuest,
  remove,
  verifyGuest,
  removeOldestGuest
};