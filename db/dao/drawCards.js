const db = require('../index');

async function createDrawCard(cardId, gameId) {
  return db.any(`
  INSERT INTO "DrawCards"("cardId", "gameId")
  VALUES($1, $2)
  RETURNING *`, [cardId, gameId])
  .then((cards) => {
    if (cards) {
      return Promise.resolve(cards[0]);
    } else return Promise.resolve(null);
  })
}

async function findDrawCardsCount(gameId) {
  return db.query(`
    SELECT count(*) AS "count" 
    FROM "DrawCards"
    WHERE "gameId" = $1
  `, [gameId])
  .then((results) => {
    if (results && results.length == 1) return Promise.resolve(results[0].count);
    return Promise.resolve(0);
  })
  .catch((err) => Promise.reject(err));
};

module.exports = {
  createDrawCard,
  findDrawCardsCount
};