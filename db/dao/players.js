const db = require('../index');

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
    const asyncTasks = [db.one(`
      DELETE FROM "Players"
      WHERE id = $1
      RETURNING id
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
  findPlayerByTurnIndex
}
