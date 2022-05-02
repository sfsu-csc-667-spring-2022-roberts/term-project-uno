const db = require('../index');

async function createPlayedCard(cardId, gameId) {
  return db.one(`
    INSERT INTO "PlayedCards"("cardId", "gameId")
    VALUES($1, $2)
    RETURNING *
  `, [cardId, gameId])
  .then((result) => {
    if (result) {
      return Promise.resolve(result[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findTopOfPlayedCards(gameId) {
  return db.any(`
    SELECT * 
    FROM "PlayedCards" 
    WHERE "gameId" = $1 
    OFFSET ((SELECT COUNT(*) FROM "PlayedCards" WHERE "gameId" = $1)-1)
  `, [gameId])
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(results[0]);
    } else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function findAllPlayedCards(gameId) {
  return db.query(`
    SELECT id, color, value, special
    FROM "PlayedCards"
    INNER JOIN "Cards"
    ON "cardId" = id
    WHERE "gameId" = $1
  `, [gameId])
  .catch(err => Promise.reject(err));
}

module.exports = {
  createPlayedCard,
  findTopOfPlayedCards,
  findAllPlayedCards
};