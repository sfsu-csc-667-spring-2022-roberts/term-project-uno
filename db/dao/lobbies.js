const db = require('../index');
const bcrypt = require('bcrypt');

const LobbyError = require('../../helpers/error/LobbyError');
const { verifyGuest } = require('../dao/lobbyGuests');

async function createPrivate(userId, name, playerCapacity, password) {
  return bcrypt.hash(password, 8)
  .then((hashedPassword) => {
    return db.any(`
      INSERT INTO $1:name($2:name, name, password, $3:name)
      VALUES($4, $5, $6, $7)
      RETURNING *`,
      ['Lobbies', 'hostId', 'playerCapacity', userId, name, hashedPassword, playerCapacity]);
  })
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(results[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function createPublic(userId, name, playerCapacity) {
  return db.any(`
    INSERT INTO $1:name($2:name, name, $3:name)
    VALUES($4, $5, $6)
    RETURNING *`,
    ['Lobbies', 'hostId', 'playerCapacity', userId, name, playerCapacity])
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(results[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function deleteLobby(id) {
  return db.query(`
    DELETE FROM "Lobbies"
    WHERE id = $1
    RETURNING id`, [id])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(results[0].id);
    else return Promise.resolve(-1);
  })
  .catch((err) => Promise.reject(err));
}

async function findLobby(id) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE id = $2`, ['Lobbies', id])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(results[0]);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findFreeLobby(lobbyId) {
  return db.query(`
  SELECT *
  FROM $1:name
  WHERE id = $2 AND busy = $3`, ['Lobbies', lobbyId, false])
.then((results) => {
  if (results && results.length === 1) return Promise.resolve(results);
  else return Promise.resolve(null);
})
.catch((err) => Promise.reject(err));
}

async function findHostLobbies(hostId) {
  return db.query(`
  SELECT *
  FROM $1:name
  WHERE $2:name = $3`, ['Lobbies', 'hostId', hostId])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllFreeLobbies() {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE busy = $2
    ORDER BY $3:name DESC`, ['Lobbies', false, 'createdAt'])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function verifyHost(userId, lobbyId) {
  return db.query(`
    SELECT $1:name
    FROM $2:name
    WHERE id = $3`, ['hostId', 'Lobbies', lobbyId])
  .then((results) => {
    if (result && results.length === 1 && results[0].hostId === userId) {
      return Promise.resolve(true);
    } else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function verifyHostOrGuest(userId, lobbyId) {
  return db.query(`
    SELECT $1:name
    FROM $2:name
    WHERE id = $3`, ['hostId', 'Lobbies', lobbyId])
  .then((results) => {
    if (result && results.length === 1 && results[0].hostId === userId) {
      return Promise.resolve(true);
    } else return verifyGuest(userId, lobbyId);
  })
  .then((isGuest) => Promise.resolve(isGuest))
  .catch((err) => Promise.reject(err));
}

module.exports = {
  createPrivate,
  createPublic, 
  deleteLobby,
  findLobby,
  findFreeLobby,
  findHostLobbies,
  findAllFreeLobbies,
  verifyHost,
  verifyHostOrGuest,
}