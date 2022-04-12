const db = require('../index');

async function create(userId, lobbyId) {
  return db.any(`
    INSERT INTO $1:name($2:name, $3:name)
    VALUES ($4, $5)
    RETURNING $6:name`, 
    ['LobbyInvitations', 'userId', 'lobbyId', userId, lobbyId, 'lobbyId'])
    .then((results) => {
      if (results && results.length === 1) {
        return Promise.resolve(results[0].lobbyId);
      } else return Promise.resolve(null);
    })
    .catch((err) => Promise.reject(err));
}

async function findUsersInvitations(userId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, ['LobbyInvitations', 'userId', userId])
  .then((results) => {
    if (results) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findLobbysInvitations(lobbyId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, ['LobbyInvitations', 'lobbyId', lobbyId])
  .then((results) => {
    if (results) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  create,
  findUsersInvitations,
  findLobbysInvitations
}