const db = require('../index');
const bcrypt = require('bcrypt');

async function authenticate(lobbyId, password) {
  return db.query(`
    SELECT *
    FROM "Lobbies"
    WHERE id = $1`, [lobbyId])
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(bcrypt.compare(password, results[0].password));
    } else return Promise.resolve(-1);
  })
  .catch((e) => Promise.reject(e));
}

async function createPrivate(userId, name, playerCapacity, password) {
  return bcrypt.hash(password, 8)
  .then((hashedPassword) => db.one(`
    INSERT INTO "Lobbies"("hostId", name, password, "playerCapacity")
    VALUES($1, $2, $3, $4)
    RETURNING *
  `, [userId, name, hashedPassword, playerCapacity]))
  .catch((err) => Promise.reject(err));
}

async function createPublic(userId, name, playerCapacity) {
  return db.one(`
    INSERT INTO "Lobbies"("hostId", name, "playerCapacity")
    VALUES($1, $2, $3)
    RETURNING *
  `, [userId, name, playerCapacity])
  .catch((err) => Promise.reject(err));
}

async function deleteLobby(lobbyId) {
  return db.any(`
    DELETE 
    FROM "LobbyMessages"
    WHERE "lobbyId" = $1;
    DELETE
    FROM "LobbyGuests"
    WHERE "lobbyId" = $1;
    DELETE FROM "Lobbies"
    WHERE id = $1
  `, [lobbyId])
  .catch((err) => Promise.reject(err));
}

async function findLobby(lobbyId) {
  return db.query(`
    SELECT *
    FROM "Lobbies"
    WHERE id = $1
  `, [lobbyId])
  .then((lobbies) => {
    if (lobbies && lobbies.length === 1) return Promise.resolve(lobbies[0]);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllFreeLobbies() {
  return db.query(`
    SELECT "Lobbies".id, name, "playerCapacity", "Lobbies"."createdAt", (
    CASE 
      WHEN "Lobbies".password IS NULL 
      THEN 'public' 
      ELSE 'private' 
    END) AS type, (
    CASE 
      WHEN count IS NULL 
      THEN 0 
      ELSE CAST(count AS INTEGER)
    END) AS "guestLength", username AS "hostName" 
    FROM "Lobbies" 
    INNER JOIN "Users" 
    ON "Users".id = "hostId" 
    FULL JOIN (
      SELECT count(*), "lobbyId" 
      FROM "LobbyGuests" 
      GROUP BY "lobbyId"
    ) AS lobbyguests 
    ON "Lobbies".id = "lobbyId" 
    WHERE busy = FALSE 
    ORDER BY "Lobbies"."createdAt" DESC;
  `, [])
  .catch((err) => Promise.reject(err));
}

async function findLobbiesBySimilarName(name) {
  return db.query(`
    SELECT "Lobbies".id, name, "playerCapacity", "Lobbies"."createdAt", (
    CASE 
      WHEN "Lobbies".password IS NULL 
      THEN 'public' 
      ELSE 'private' 
    END) AS type, (
    CASE 
      WHEN count IS NULL 
      THEN 0 
      ELSE CAST(count AS INTEGER)
    END) AS "guestLength", username AS "hostName" 
    FROM "Lobbies" 
    INNER JOIN "Users" 
    ON "Users".id = "hostId" 
    FULL JOIN (
      SELECT count(*), "lobbyId" 
      FROM "LobbyGuests" 
      GROUP BY "lobbyId"
    ) AS lobbyguests 
    ON "Lobbies".id = "lobbyId" 
    WHERE name LIKE $1
    ORDER BY "Lobbies"."createdAt" DESC;
  `, [`%${name}%`])
  .catch((err) => Promise.reject(err));
}

async function findAllMembers(lobbyId) {
  const findUserById = async (userId) => db.one(`
    SELECT "Users".id, username, "gamesWon", "gamesPlayed", "createdAt", location AS avatar, portrait
    FROM "Users"
    FULL JOIN (
      SELECT "userId", location, (
      CASE 
        WHEN height <= width 
        THEN FALSE 
        ELSE TRUE 
      END) AS portrait 
      FROM "Avatars"
    ) AS avatars 
    ON "Users".id = "userId"
    WHERE id = $1
  `, [userId])
  .catch((e) => Promise.reject(e));

  return db.one(`
    SELECT "hostId"
    FROM "Lobbies"
    WHERE id = $1
  `, [lobbyId])
  .then((lobby) => Promise.all([lobby.hostId, db.query(`
    SELECT "userId", "userReady"
    FROM "LobbyGuests"
    WHERE "lobbyId" = $1
    ORDER BY "joinedAt" ASC
  `, [lobbyId])]))
  .then(async (lobbyMembers) => {
    const hostId = lobbyMembers[0];
    const guests = lobbyMembers[1];
    const asyncTasks = [findUserById(hostId)];
    const members = [];

    guests.forEach((guest) => {
      asyncTasks.push(findUserById(guest.userId));
    })

    const users = await Promise.all(asyncTasks);

    for (let i = 0; i < users.length; i++) {
      const member = {
        username: users[i].username,
        avatar: users[i].avatar,
        portrait: users[i].portrait,
        id: users[i].id
      };

      if (i != 0) member.ready = guests[i - 1].userReady;
      else member.host = true;

      members.push(member);
    }

    return Promise.resolve(members);
  })
  .catch((err) => Promise.reject(err));
}

async function setBusy(lobbyId, busy) {
  return db.one(`
    UPDATE "Lobbies"
    SET busy = $1
    WHERE id = $2
    RETURNING id
  `, [busy, lobbyId])
  .catch((err) => Promise.reject(err));
}

async function verifyHost(userId, lobbyId) {
  return db.query(`
    SELECT *
    FROM "Lobbies"
    WHERE "hostId" = $1 AND id = $2
  `, [userId, lobbyId])
  .then((lobbies) => {
    if (lobbies && lobbies.length == 1) return Promise.resolve(true);
    return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function verifyHostOrGuest(userId, lobbyId) {
  return db.query(`
    SELECT * 
    FROM "Lobbies" 
    FULL JOIN "LobbyGuests" 
    ON id = "lobbyId" 
    WHERE ("hostId" = $1 OR "userId" = $1) AND id = $2
  `, [userId, lobbyId])
  .then((lobbies) => {
    if (lobbies && lobbies.length > 0) {
      return Promise.resolve(true);
    } else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function setHost(newHostId, lobbyId) {
  return db.one(`
    UPDATE "Lobbies"
    SET "hostId" = $1
    WHERE id = $2
    RETURNING id
  `, [newHostId, lobbyId])
  .catch((err) => Promise.reject(err));
}

async function updateLobby(lobbyId, lobbyName, maxPlayers) {
  return db.one(`
    UPDATE "Lobbies"
    SET name = $2, "playerCapacity" = $3
    WHERE id = $1
    RETURNING *
  `, [lobbyId, lobbyName, maxPlayers])
  .catch((err) => Promise.reject(err));
}

async function updateLobbyAndPassword(lobbyId, lobbyName, maxPlayers, password) {
  return bcrypt.hash(password, 8)
  .then((hashedPassword) => db.one(`
    UPDATE "Lobbies"
    SET name = $2, "playerCapacity" = $3, password = $4
    WHERE id = $1
    RETURNING *
  `, [lobbyId, lobbyName, maxPlayers, hashedPassword]))
  .catch((err) => Promise.reject(err));
}

module.exports = {
  authenticate,
  createPrivate,
  createPublic, 
  deleteLobby,
  findLobby,
  findLobbiesBySimilarName,
  findAllMembers,
  findAllFreeLobbies,
  setBusy,
  setHost,
  verifyHost,
  verifyHostOrGuest,
  updateLobby,
  updateLobbyAndPassword
}