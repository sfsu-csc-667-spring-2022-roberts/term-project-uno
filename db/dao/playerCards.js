const db = require('../index');

async function createPlayerCard(cardId, playerId) {
  return db.any(`
  INSERT INTO $1:name($2:name, $3:name)
  VALUES($4, $5)
  RETURNING *`, ['PlayerCards', 'cardId', 'playerId', cardId, playerId])
  .then((result) => {
    if (result) {
      return Promise.resolve(result[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function verifyPlayerCard(cardId, playerId) {
  return db.any(`
  SELECT *
  FROM "PlayerCards"
  WHERE "playerId" = $1 AND "cardId" = $2
  `, [playerId, cardId])
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(true);
    } else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function removePlayerCard(cardId, playerId) {
  return db.any(`
  DELETE
  FROM "PlayerCards"
  WHERE "playerId" = $1 AND "cardId" = $2
  `, [playerId, cardId])
  .then((result) => {
    if (result) {
      return Promise.resolve(true);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findCardCount(playerId) {
  return db.query(`
    SELECT COUNT(*) FROM "PlayerCards"
    WHERE "playerId" = $1
  `, [playerId])
  .then((result) => {
    if (result) return Promise.resolve(parseInt(result[0].count));
    else return Promise.resolve(-1);
  })
  .catch((err) => Promise.reject(err));
}

async function findPlayerCards(playerId) {
  return db.query(`
    SELECT * FROM "Cards"
    WHERE "id"
    IN (SELECT "cardId"
        FROM "PlayerCards"
        WHERE "playerId" = $1)
  `, [playerId])
  .then((results) => {
    if (results && results.length > 1) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(null));
}

async function findPlayerCardIdsAndDelete(playerId) {
  return db.query(`
    DELETE FROM "PlayerCards" WHERE "cardId" IN
    (SELECT "cardId" FROM "PlayerCards" WHERE "playerId" = $1)
    RETURNING "cardId"
  `, [playerId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(null));
}

module.exports = {
  createPlayerCard,
  verifyPlayerCard,
  removePlayerCard,
  findCardCount,
  findPlayerCards,
  findPlayerCardIdsAndDelete
};