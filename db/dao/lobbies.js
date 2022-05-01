const db = require('../index');
const bcrypt = require('bcrypt');
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

async function deleteLobby(lobbyId) {
  return db.any(`
    DELETE FROM "LobbyMessages"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .then(() => {
    return db.one(`
      DELETE FROM "Lobbies"
      WHERE id = $1
      RETURNING id
    `, [lobbyId]);
  })
  .catch((err) => Promise.reject(err));
}

async function findLobby(lobbyId) {
  return db.query(`
    SELECT *
    FROM "Lobbies"
    WHERE id = $1
  `, [lobbyId])
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
    ORDER BY $3:name DESC`, 
  ['Lobbies', false, 'createdAt'])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllMembers(lobbyId) {
  const findUserById = async (userId) => db.one(`
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
  return db.one(`
    SELECT "hostId"
    FROM "Lobbies"
    WHERE id = $1`, [lobbyId])
  .then((lobby) => {
    if (lobby.hostId === userId) {
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
    if (results && results.length === 1 && results[0].hostId === userId) {
      return Promise.resolve(true);
    } else return verifyGuest(userId, lobbyId);
  })
  .then((isGuest) => Promise.resolve(isGuest))
  .catch((err) => Promise.reject(err));
}

async function setHost(newHostId, lobbyId) {
  return db.query(`
    UPDATE "Lobbies"
    SET "hostId" = $1
    WHERE id = $2
    RETURNING id
  `, [newHostId, lobbyId])
  .catch((err) => Promise.reject(err));
}

module.exports = {
  createPrivate,
  createPublic, 
  deleteLobby,
  findLobby,
  findFreeLobby,
  findHostLobbies,
  findAllMembers,
  findAllFreeLobbies,
  setBusy,
  setHost,
  verifyHost,
  verifyHostOrGuest,
}