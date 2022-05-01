const db = require('../index');

async function createDrawCard(cardId, gameId) {
  return db.any(`
  INSERT INTO $1:name($2:name, $3:name)
  VALUES($4, $5)
  RETURNING *`, ['DrawCards', 'cardId', 'gameId', cardId, gameId])
  .then((result) => {
    if (result) {
      return Promise.resolve(result[0]);
    } else return Promise.resolve(null);
  })
}

async function findDrawCardsCount(gameId) {
  return db.query(`
    SELECT count(*) AS "count" FROM "DrawCards"
    WHERE "gameId" = $1`, [gameId])
  .then((results) => {
    if (results) return Promise.resolve(results[0].count);
    return Promise.resolve(0);
  })
  .catch((err) => Promise.reject(err));
};

module.exports = {
  createDrawCard,
  findDrawCardsCount
};