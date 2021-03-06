const db = require('../index');
const bcrypt = require('bcrypt');

async function findLobbyGuests(guestId) {
  return db.query(`
    SELECT *
    FROM "LobbyGuests"
    WHERE "userId" = $1
  `, [guestId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findNumberOfGuests(lobbyId) {
  return db.query(`
    SELECT count(*)
    FROM "LobbyGuests"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(parseInt(results[0].count));
    return Promise.resolve(0);
  })
  .catch((err) => Promise.reject(err))
}

async function getAllLobbyGuests() {
  return db.query(`
    SELECT *
    FROM "LobbyGuests"`
  , [])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllLobbyGuests(lobbyId) {
  return db.query(`
    SELECT *
    FROM "LobbyGuests"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .then((lobbyGuests) => {
    return Promise.resolve(lobbyGuests);
  })
  .catch((err) => Promise.reject(err));
}

async function addGuest(guestId, lobbyId) {
  return db.any(`
    INSERT INTO "LobbyGuests"("userId", "lobbyId")
    VALUES($1, $2)
    RETURNING *
  `,[guestId, lobbyId])
  .then((lobbyGuests) => {
    return Promise.resolve(lobbyGuests);
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
       ORDER BY "joinedAt"
       LIMIT 1)
    RETURNING "userId"
  `, [lobbyId])
  .then((lobbyGuests) => Promise.resolve(lobbyGuests[0].userId))
  .catch((err) => Promise.reject(err));
}

async function toggleReady(userId, lobbyId) {
  return db.one(`
    UPDATE "LobbyGuests" 
    SET "userReady" = NOT "userReady" 
    WHERE "userId" = $1 AND "lobbyId" = $2
    RETURNING *
  `, [userId, lobbyId])
  .catch((err) => Promise.reject(err));
}

async function verifyAllGuestsReady(lobbyId) {
  return db.any(`
    SELECT "userReady"
    FROM "LobbyGuests"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .then((lobbyGuests) => {
    if (lobbyGuests && lobbyGuests.length > 0) {
      for (let i = 0; i < lobbyGuests.length; i++) {
        if (!lobbyGuests[i].userReady) return Promise.resolve(false);
      }
      return Promise.resolve(true);
    } else return Promise.resolve(false);
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
  removeOldestGuest,
  toggleReady,
  verifyAllGuestsReady,
  findNumberOfGuests
};