const db = require('../index');

async function createGameMessage(message, userId, gameId) {
  return db.one(`
    INSERT INTO "GameMessages"(message, "userId", "gameId")
    VALUES($1, $2, $3);
    SELECT * FROM (
      SELECT ROW_NUMBER() OVER (ORDER BY "GameMessages"."createdAt") AS id, message, "GameMessages"."createdAt", username AS sender 
      FROM "GameMessages" 
      FULL JOIN "Users" 
      ON "userId" = id
      WHERE "gameId" = $3
      ORDER BY "GameMessages"."createdAt" ASC
    ) AS messages
    WHERE id = (SELECT max(id) FROM (
      SELECT ROW_NUMBER() OVER (ORDER BY "GameMessages"."createdAt") AS id, message, "GameMessages"."createdAt", username AS sender 
      FROM "GameMessages" 
      FULL JOIN "Users" 
      ON "userId" = id
      WHERE "gameId" = $3
      ORDER BY "GameMessages"."createdAt" ASC
    ) AS messages)
  `, [message, userId, gameId])
  .catch((err) => Promise.reject(err));
}

async function createLobbyMessage(message, userId, lobbyId) {
  return db.one(`
    INSERT INTO "LobbyMessages"(message, "userId", "lobbyId")
    VALUES($1, $2, $3);
    SELECT * FROM (
      SELECT ROW_NUMBER() OVER (ORDER BY "LobbyMessages"."createdAt") AS id, message, "LobbyMessages"."createdAt", username AS sender 
      FROM "LobbyMessages" 
      FULL JOIN "Users" 
      ON "userId" = id
      WHERE "lobbyId" = $3
      ORDER BY "LobbyMessages"."createdAt" ASC
    ) AS messages
    WHERE id = (SELECT max(id) FROM (
      SELECT ROW_NUMBER() OVER (ORDER BY "LobbyMessages"."createdAt") AS id, message, "LobbyMessages"."createdAt", username AS sender 
      FROM "LobbyMessages" 
      FULL JOIN "Users" 
      ON "userId" = id
      WHERE "lobbyId" = $3
      ORDER BY "LobbyMessages"."createdAt" ASC
    ) AS messages)
  `, [message, userId, lobbyId])
  .catch((err) => Promise.reject(err));
}

async function findGameMessages(gameId) {
  return db.query(`
    SELECT ROW_NUMBER() OVER (ORDER BY "GameMessages"."createdAt") AS id, message, "GameMessages"."createdAt", username AS sender 
    FROM "GameMessages" 
    FULL JOIN "Users" 
    ON "userId" = id
    WHERE "gameId" = $1
    ORDER BY "GameMessages"."createdAt" ASC
  `, [gameId])
  .catch((err) => Promise.reject(err));
}

async function findLobbyMessages(lobbyId) {
  return db.query(`
    SELECT ROW_NUMBER() OVER (ORDER BY "LobbyMessages"."createdAt") AS id, message, "LobbyMessages"."createdAt", username AS sender 
    FROM "LobbyMessages" 
    FULL JOIN "Users" 
    ON "userId" = id
    WHERE "lobbyId" = $1
    ORDER BY "LobbyMessages"."createdAt" ASC
  `, [lobbyId])
  .catch((err) => Promise.reject(err));
}

module.exports = {
  createGameMessage,
  createLobbyMessage,
  findGameMessages,
  findLobbyMessages
};