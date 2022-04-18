const db = require('../index');
const bcrypt = require('bcrypt');

const UserError = require('../../helpers/error/UserError');
const { findHostLobbies, findLobby, findFreeLobby } = require('./lobbies');
const { findLobbyGuests } = require('./lobbyGuests');
const { findPlayers } = require('./players');

async function usernameExists(username) {
  return db.query(`
    SELECT id 
    FROM $1:name 
    WHERE username = $2`, ['Users', username])
  .then((results) => {
    return Promise.resolve(results && results.length === 0);
  })
  .catch((e) => Promise.reject(e));
}

async function create(username, password) {
  return bcrypt.hash(password, 8)
  .then((hashedPassword) => {
    return db.any(`
      INSERT INTO $1:name(username, password) 
      VALUES($2, $3) 
      RETURNING id`, ['Users', username, hashedPassword]);
  })
  .then((results) => {
    if (results && results.length === 1) {
      const userId = results[0].id;
      return Promise.resolve(userId);
    } else return Promise.resolve(-1);
  })
  .catch((err) => Promise.reject(err));
}

async function authenticate(username, password) {
  let userId;
  return db.query(`
    SELECT id, username, password 
    FROM $1:name 
    WHERE username = $2`, ['Users', username])
  .then((results) => {
    if (results && results.length === 1) {
      userId = results[0].id;
      return bcrypt.compare(password, results[0].password);
    } else return Promise.resolve(-1);
  })
  .then((passwordsMatch) => {
    if (passwordsMatch) return Promise.resolve(userId);
    return Promise.resolve(-1);
  })
  .catch((e) => Promise.reject(e));
}

async function findUserById(id) {
  return db.query(`
    SELECT id, username, $1:name, $2:name, $3:name, $4:name 
    FROM $5:name 
    WHERE id = $6`,
    ['pictureUrl', 'gamesWon', 'gamesPlayed', 'createdAt', 'Users', id])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(results[0]);
    else return Promise.resolve(null);
  })
  .catch((e) => Promise.reject(e));
}

async function findUserByName(username) {
  return db.query(`
    SELECT id, username, $1:name, $2:name, $3:name, $4:name 
    FROM $5:name 
    WHERE username = $6`,
    ['pictureUrl', 'gamesWon', 'gamesPlayed', 'createdAt', 'Users', username])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(results[0]);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function changeUsername(oldUsername, newUsername, password) {
  const userId = await authenticate(oldUsername, password);
  if (userId > 0) {
    return db.query(`
      UPDATE $1:name
      SET username = replace(username, $2, $3)
      WHERE id = $4
      RETURNING id`,
      ['Users', oldUsername, newUsername, userId])
    .then((results) => {
      if (results && results.length === 1) return Promise.resolve(results[0].id);
      else return Promise.resolve(-1);
    })
    .catch((err) => Promise.reject(err));
  } else throw new UserError('Invalid password', 401);
}

async function changePassword(username, oldPassword, newPassword) {
  const userId = await authenticate(username, oldPassword);
  if (userId > 0) {
    return bcrypt.hash(newPassword, 8)
    .then((newHashedPassword) => {
      return db.query(`
        UPDATE $1:name
        SET password = $2
        WHERE id = $3
        RETURNING id`,
        ['Users', newHashedPassword, userId])
    })
    .then((results) => {
      if (results && results.length === 1) return Promise.resolve(results[0].id);
      else return Promise.resolve(-1);
    })
    .catch((err) => Promise.reject(err));
  } else throw new UserError('Invalid password', 401);
}

async function findUserBySimilarName(username) {
  return db.query(`
    SELECT id, username, $1:name, $2:name, $3:name, $4:name 
    FROM $5:name 
    WHERE username
    LIKE $6`,
    ['pictureUrl', 'gamesWon', 'gamesPlayed', 'createdAt', 'Users', `%${username}%`])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllLobbies(userId) {
  return findLobbyGuests(userId)
  .then((lobbyGuests) => {
    const asyncTasks = [findHostLobbies(userId)];
    if (lobbyGuests) {
      lobbyGuests.forEach((lobbyGuest) => {
        asyncTasks.push(findLobby(lobbyGuest.lobbyId));
      })
    } 
    return Promise.allSettled(asyncTasks);
  })
  .then((results) => {
    const hostLobbies = results[0];
    let lobbies = results.slice(1, results.length).map((result) => {
      if (result.status === 'fulfilled' && result.value) {
        if (result.value.password) delete result.value.password;
        return result.value;
      }
    });
    if (hostLobbies.status === 'fulfilled') {
      lobbies = hostLobbies.value.map((hostLobby) => {
        if (hostLobby.password) delete hostLobby.password;
        return hostLobby;
      })
      .concat(lobbies);
    }
    
    if (lobbies && lobbies.length > 0) return Promise.resolve(lobbies);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  usernameExists,
  create,
  authenticate,
  findUserById,
  findUserByName,
  findAllLobbies,
  changeUsername,
  changePassword,
  findUserBySimilarName
};