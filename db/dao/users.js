const db = require('../index');
const bcrypt = require('bcrypt');

const UserError = require('../../helpers/error/UserError');

async function usernameExists(username) {
  return db.query(`
    SELECT id 
    FROM "Users"
    WHERE username = $1
  `, [username])
  .then((results) => {
    return Promise.resolve(results && results.length === 0);
  })
  .catch((e) => Promise.reject(e));
}

async function create(username, password) {
  return bcrypt.hash(password, 8)
  .then((hashedPassword) => db.one(`
    INSERT INTO "Users"(username, password) 
    VALUES($1, $2) 
    RETURNING id
  `, [username, hashedPassword]))
  .then((user) => Promise.resolve(user.id))
  .catch((err) => Promise.reject(err));
}

async function authenticate(username, password) {
  let userId;
  return db.query(`
    SELECT id, username, password 
    FROM "Users"
    WHERE username = $1
  `, [username])
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
    SELECT id, username, "gamesWon", "gamesPlayed", "createdAt", location AS avatar, (
    CASE 
      WHEN height <= width 
      THEN FALSE 
      ELSE TRUE 
    END) AS portrait 
    FROM "Users" 
    FULL JOIN "Avatars" 
    ON id = "userId" 
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
    SELECT id, username, "gamesWon", "gamesPlayed", "createdAt", location AS avatar, (
    CASE 
      WHEN height <= width 
      THEN FALSE 
      ELSE TRUE 
    END) AS portrait 
    FROM "Users" 
    FULL JOIN "Avatars" 
    ON id = "userId" 
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
    return db.one(`
      UPDATE "Users"
      SET username = replace(username, $1, $2)
      WHERE id = $3
      RETURNING id
    `, [oldUsername, newUsername, userId])
    .then((user) => Promise.resolve(user.id))
    .catch((err) => Promise.reject(err));
  } else throw new UserError('Invalid password', 401);
}

async function changePassword(username, oldPassword, newPassword) {
  const userId = await authenticate(username, oldPassword);
  if (userId > 0) {
    return bcrypt.hash(newPassword, 8)
    .then((newHashedPassword) => db.one(`
      UPDATE "Users"
      SET password = $1
      WHERE id = $2
      RETURNING id
    `, [newHashedPassword, userId]))
    .then((user) => Promise.resolve(user.id))
    .catch((err) => Promise.reject(err));
  } else throw new UserError('Invalid password', 401);
}

async function findUsersBySimilarName(username) {
  return db.query(`
    SELECT id, username, "gamesWon", "gamesPlayed", "createdAt", location AS avatar, (
    CASE 
      WHEN height <= width 
      THEN FALSE 
      ELSE TRUE 
    END) AS portrait 
    FROM "Users" 
    FULL JOIN "Avatars" 
    ON id = "userId" 
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

async function getScores() {
  return db.query(`
    SELECT id, "gamesPlayed", "gamesWon", ("gamesWon" - ("gamesPlayed" - "gamesWon")) AS score, username,
    "createdAt", location AS avatar, (CASE
      WHEN height <= width
      THEN FALSE
      ELSE TRUE
    END) AS portrait
    FROM "Users" 
    FULL JOIN "Avatars"
    ON id = "userId"
    WHERE "gamesPlayed" > 0
    ORDER BY score DESC
    LIMIT 10`, [])
  .then((results) => Promise.resolve(results))
  .catch((e) => Promise.reject(e));
}

module.exports = {
  usernameExists,
  create,
  authenticate,
  findUserById,
  findUserByName,
  findAllFormattedLobbies,
  changeUsername,
  changePassword,
  findUsersBySimilarName,
  verifyUserExists,
  addWin,
  addLoss,
  findInvitations,
  getScores
};