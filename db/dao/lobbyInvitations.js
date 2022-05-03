const db = require('../index');

async function create(userId, lobbyId) {
  return db.one(`
    INSERT INTO "LobbyInvitations"("userId", "lobbyId")
    VALUES ($1, $2)
    RETURNING *
  `, [userId, lobbyId])
  .catch((err) => Promise.reject(err));
}

async function findUsersInvitations(userId) {
  return db.query(`
    SELECT *
    FROM "LobbyInvitations"
    WHERE "userId" = $1
    ORDER BY "createdAt" DESC
  `, [userId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findLobbysInvitations(lobbyId) {
  return db.query(`
    SELECT *
    FROM "LobbyInvitations"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function removeLobbyInvitations(lobbyId) {
  return db.query(`
    DELETE FROM "LobbyInvitations"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .catch((err) => Promise.reject(err));
}

async function removeUserInvitation(userId, lobbyId) {
  return db.query(`
    DELETE FROM "LobbyInvitations"
    WHERE "userId" = $1 AND "lobbyId" = $2
    RETURNING *
  `, [userId, lobbyId])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function checkInvitationExists(userId, lobbyId) {
  return db.query(`
    SELECT *
    FROM "LobbyInvitations"
    WHERE "userId" = $1 AND "lobbyId" = $2
  `, [userId, lobbyId])
  .then((invitations) => {
    if (invitations && invitations.length > 0) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function checkUserHasInvitations(userId) {
  return db.query(`
    SELECT "lobbyId"
    FROM "LobbyInvitations"
    WHERE "userId" = $1
  `, [userId])
  .then((invitations) => {
    if (invitations && invitations.length > 0) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  create,
  findUsersInvitations,
  findLobbysInvitations,
  removeLobbyInvitations,
  removeUserInvitation,
  checkInvitationExists,
  checkUserHasInvitations
}