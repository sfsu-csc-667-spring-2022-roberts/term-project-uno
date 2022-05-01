const db = require('../index');
const bcrypt = require('bcrypt');

const UserError = require('../../helpers/error/UserError');

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

async function findUserById(userId) {
  return db.query(`
  SELECT id, username, "gamesWon", "gamesPlayed", "createdAt", avatar, portrait 
  FROM "Users" 
  FULL JOIN (
    SELECT location, (
    CASE 
      WHEN height > width 
      THEN TRUE 
      ELSE FALSE 
    END) AS portrait 
    FROM "Avatars"
  ) AS avatars 
  ON location = avatar
  WHERE id = $1
  `, [userId])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(results[0]);
    else return Promise.resolve(null);
  })
  .catch((e) => Promise.reject(e));
}

async function findUserByName(username) {
  return db.query(`
    SELECT id, username, "gamesWon", "gamesPlayed", "createdAt", avatar, portrait 
    FROM "Users" 
    FULL JOIN (
      SELECT location, (
      CASE 
        WHEN height > width 
        THEN TRUE 
        ELSE FALSE 
      END) AS portrait 
      FROM "Avatars"
    ) AS avatars 
    ON location = avatar
    WHERE username = $1
  `, [username])
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

async function changeAvatar(key, userId) {
  return db.one(`
    UPDATE "Users"
    SET avatar = $1
    WHERE id = $2
    RETURNING id
  `, [key, userId])
  .catch((err) => Promise.reject(err));
}

async function findUsersBySimilarName(username) {
  return db.query(`
    SELECT id, username, "gamesWon", "gamesPlayed", "createdAt", avatar, portrait 
    FROM "Users" 
    FULL JOIN (
      SELECT location, (
      CASE 
        WHEN height > width 
        THEN TRUE 
        ELSE FALSE 
      END) AS portrait 
      FROM "Avatars"
    ) AS avatars 
    ON location = avatar
    WHERE username LIKE $1
    ORDER BY username
    `,
    [`%${username}%`])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllFormattedLobbies(userId) {
  return db.query(`
  SELECT lobbies.id as id, name, CAST ("guestLength" AS INTEGER), username AS "hostName", busy, "playerCapacity", lobbies."createdAt" 
  FROM (
    SELECT id, "hostId", name, "playerCapacity", busy, "createdAt", (
      CASE
        WHEN "guestLength" IS NULL 
        THEN 0
        ELSE "guestLength"
      END) AS "guestLength"
    FROM "Lobbies" 
    FULL JOIN (
      SELECT count(*) AS "guestLength", "lobbyId" FROM "LobbyGuests" 
      GROUP BY "lobbyId"
    ) AS guest_count 
    ON "lobbyId" = id
  ) AS lobbies 
  INNER JOIN (
    SELECT * FROM "Users" WHERE "Users".id = $1
  ) AS users 
  ON "hostId" = users.id
  UNION 
  SELECT lobby_id AS id, name, CAST(count AS INTEGER) AS "guestLength", username AS "hostName", busy, "playerCapacity", t."createdAt"
  FROM (
    SELECT * FROM (
      SELECT * FROM "LobbyGuests" 
      INNER JOIN "Lobbies" 
      ON "lobbyId" = "Lobbies".id
      WHERE "userId" = $1
    ) AS lobbyguests 
    INNER JOIN (
      SELECT count(*), "lobbyId" AS lobby_id
      FROM "LobbyGuests" 
      GROUP BY "lobbyId"
    ) AS lobbycount 
    ON lobbyguests.id = lobby_id
  ) AS t 
  INNER JOIN (
    SELECT * FROM "Users"
  ) AS users 
  ON t."hostId" = users.id
  `, [userId])
  .catch((err) => Promise.reject(err));
}

async function verifyUserExists(userId) {
  return db.query(`\
    SELECT id 
    FROM "Users"
    WHERE id = $1
  `, [userId])
  .then((users) => {
    if (users && users.length > 0) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function addWin(userId) {
  return db.one(`
    UPDATE "Users"
    SET "gamesPlayed" = "gamesPlayed" + 1, "gamesWon" = "gamesWon" + 1
    WHERE id = $1
    RETURNING id
  `, [userId])
  .catch((err) => Promise.reject(err));
}

async function addLoss(userId) {
  return db.one(`
    UPDATE "Users"
    SET "gamesPlayed" = "gamesPlayed" + 1
    WHERE id = $1
    RETURNING id
  `, [userId])
  .catch((err) => Promise.reject(err));
}

async function findInvitations(userId) {
  return db.query(`
    SELECT "lobbyId", name AS "lobbyName", "LobbyInvitations"."createdAt" 
    FROM "LobbyInvitations" 
    INNER JOIN "Lobbies" 
    ON "lobbyId" = id 
    WHERE "userId" = $1
    ORDER BY "LobbyInvitations"."createdAt" DESC
  `, [userId])
  .catch(err => Promise.reject(err));
}

module.exports = {
  usernameExists,
  create,
  authenticate,
  findUserById,
  findUserByName,
  findAllFormattedLobbies,
  changeAvatar,
  changeUsername,
  changePassword,
  findUsersBySimilarName,
  verifyUserExists,
  addWin,
  addLoss,
  findInvitations
};