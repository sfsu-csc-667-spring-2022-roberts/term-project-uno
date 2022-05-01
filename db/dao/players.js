const db = require('../index');
const DrawCardDao = require('./drawCards');

async function findPlayersWithFullInfo(gameId) {
  return db.query(`
    SELECT id, "userID", "turnIndex", username, CAST (cards AS INTEGER), avatar,
      (CASE
        WHEN portrait IS NULL
        THEN TRUE ELSE portrait
      END) AS portrait
    FROM (
      SELECT * FROM "Players" 
      INNER JOIN (
        SELECT id AS "userID", username, avatar, portrait 
        FROM "Users" FULL JOIN (
          SELECT location, (
            CASE 
              WHEN height > width 
              THEN TRUE ELSE FALSE 
            END) AS portrait 
          FROM "Avatars") 
        AS avatar_info 
        ON location = avatar) 
      AS user_info 
      ON "Players"."userId" = "userID") 
    AS full_user_info 
    INNER JOIN (
      SELECT count(*) as cards, "playerId" 
      FROM "PlayerCards" 
      GROUP BY "playerId") 
    AS cards_info 
    ON "playerId" = id 
    WHERE "gameId" = $1
    ORDER BY "turnIndex" ASC
  `, [gameId])
  .catch((err) => Promise.reject(err));
}

async function findPlayers(userId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, ['Players', 'userId', userId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function createPlayer(turnIndex, userId, gameId) {
  return db.any(`
  INSERT INTO $1:name($2:name, $3:name, $4:name)
  VALUES($5, $6, $7)
  RETURNING *`, ['Players', 'turnIndex', 'userId', 'gameId', turnIndex, userId, gameId])
  .then((result) => {
    if (result) {
      return Promise.resolve(result[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function verifyUserInGame(gameId, userId) {
  return db.query(`
    SELECT * FROM "Players"
    WHERE "gameId" = $1 AND "userId" = $2
  `, [gameId, userId])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function findPlayersCount(gameId) {
  return db.query(`
    SELECT * FROM "Players"
    WHERE "gameId" = $1
  `, [gameId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results.length);
    else return Promise.resolve(-1);
  })
  .catch((err) => Promise.reject(err));
}

async function remove(userId, gameId) {
  return db.query(`
    SELECT * FROM "Players"
    WHERE "gameId" = $1
    ORDER BY "turnIndex" ASC
  `, [gameId])
  .then((players) => {
    let playerToBeRemovedIdx = -1;

    for (let i = 0; i < players.length; i++) {
      if (players[i].userId == userId) {
        playerToBeRemovedIdx = i;
        break;
      }
    }

    if (playerToBeRemovedIdx < 0) return Promise.reject('Could not find player');
    const asyncTasks = [db.query(`
        DELETE FROM "PlayerCards"
        WHERE "playerId" = $1
        RETURNING *
      `, [players[playerToBeRemovedIdx].id]),
      db.one(`
        DELETE FROM "Players"
        WHERE id = $1
        RETURNING id, "gameId"
      `, [players[playerToBeRemovedIdx].id])];

    for (let i = playerToBeRemovedIdx + 1; i < players.length; i++) {
      asyncTasks.push(db.one(`
        UPDATE "Players"
        SET "turnIndex" = $1
        WHERE id = $2
        RETURNING id
      `, [players[i].turnIndex - 1, players[i].id]));
    }

    return Promise.all(asyncTasks);
  })
  .then((results) => {
    const playerCards = results[0];
    const player = results[1];
    const asyncTasks = [];
    playerCards.forEach((playerCard) => {
      asyncTasks.push(DrawCardDao.createDrawCard(playerCard.cardId, player.gameId));
    });
    return Promise.all(asyncTasks);
  })
  .catch((err) => Promise.reject(err));
}

async function findPlayersByGameId(gameId) {
  return db.query(`
    SELECT * FROM "Players"
    WHERE "gameId" = $1
  `, [gameId])
  .catch((err) => Promise.reject(err));
}

module.exports = {
  findPlayers,
  createPlayer,
  verifyUserInGame,
  findPlayersCount,
  findPlayersByGameId,
  remove,
  findPlayersWithFullInfo
}
