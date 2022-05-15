const db = require('../index');
const DrawCardDao = require('./drawCards');

async function findPlayersWithFullInfo(gameId) {
  return db.query(`
    SELECT "Players".id, "Users".id AS "userID", "turnIndex", username, location AS avatar, cards, (
    CASE 
      WHEN height <= width 
      THEN FALSE 
      ELSE TRUE 
    END) AS portrait 
    FROM "Users" 
    FULL JOIN "Avatars" 
    ON "Users".id = "Avatars"."userId" 
    INNER JOIN "Players" 
    ON "Users".id = "Players"."userId" 
    INNER JOIN (
      SELECT count(*) AS cards, "playerId" 
      FROM "PlayerCards" 
      GROUP BY "playerId"
    ) AS playercards 
    ON "Players".id = "playerId"
    WHERE "Players"."gameId" = $1
  `, [gameId])
  .catch((err) => Promise.reject(err));
}

async function findPlayer(userId, gameId) {
  return db.one(`
    SELECT * FROM "Players"
    WHERE "userId" = $1 AND "gameId" = $2
  `, [userId, gameId])
  .catch((err) => Promise.reject(err));
}

async function findPlayers(userId) {
  return db.query(`
    SELECT *
    FROM "Players"
    WHERE "userId" = $1
  `, [userId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function createPlayer(turnIndex, userId, gameId) {
  return db.any(`
    INSERT INTO "Players"("turnIndex", "userId", "gameId")
    VALUES($1, $2, $3)
    RETURNING *
  `, [turnIndex, userId, gameId])
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

async function findPlayerByTurnIndex(gameId, turnIndex) {
  return db.any(`
  SELECT * 
  FROM "Players" 
  WHERE "gameId" = $1 AND "turnIndex" = $2
  `, [gameId, turnIndex])
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(results[0]);
    } else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  findPlayers,
  createPlayer,
  verifyUserInGame,
  findPlayersCount,
  findPlayersByGameId,
  remove,
  findPlayerByTurnIndex,
  findPlayersWithFullInfo,
  findPlayer
}
