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
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(result[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function deleteAndGetCards(playerId) {
  return db.query(`
    DELECT FROM "PlayerCards"
    WHERE "playerId" = $1
    RETURNING *
  `, [playerId])
  .catch((err) => Promise.reject(err));
}

module.exports = {
  createPlayerCard,
  verifyPlayerCard,
  removePlayerCard,
  deleteAndGetCards
};