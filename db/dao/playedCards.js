const db = require('../index');

async function createPlayedCard(cardId, gameId) {
  return db.one(`
    INSERT INTO "PlayedCards"("cardId", "gameId")
    VALUES($1, $2)
    RETURNING *
  `, [cardId, gameId])
  .then((result) => Promise.resolve(result))
  .catch((err) => Promise.reject(err));
}

async function findTopOfPlayedCards(gameId) {
  return db.any(`
    SELECT * 
    FROM "PlayedCards" 
    WHERE "gameId" = $1 
    ORDER BY "createdAt" ASC
    OFFSET ((SELECT COUNT(*) FROM "PlayedCards" WHERE "gameId" = $1) - 1)
    LIMIT 1
  `, [gameId])
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(results[0]);
    } else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function removePlayedCards(gameId) {
  return db.any(`
     DELETE FROM "PlayedCards" WHERE "gameId" = $1
  `, [gameId])
  .then((results) => {
    if (results) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(null));
}

async function removePlayedCard(gameId, cardId) {
  return db.any(`
     DELETE FROM "PlayedCards" WHERE "gameId" = $1 AND "cardId" = $2
  `, [gameId, cardId])
  .then((results) => {
    if (results) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(null));
}

async function findAllPlayedCards(gameId) {
  return db.query(`
    SELECT id, color, value, special
    FROM "PlayedCards"
    INNER JOIN "Cards"
    ON "cardId" = id
    WHERE "gameId" = $1
    ORDER BY "createdAt" ASC
  `, [gameId])
  .catch(err => Promise.reject(err));
}

module.exports = {
  createPlayedCard,
  findTopOfPlayedCards,
  removePlayedCards,
  removePlayedCard,
  findAllPlayedCards
};