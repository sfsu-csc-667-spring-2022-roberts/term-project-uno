const db = require('../index');

async function findPlayerCardsByUserId(userId, gameId) {
  return db.query(`
    SELECT id, color, value, special 
    FROM (
      SELECT "cardId" 
      FROM (
        SELECT id AS player_id 
        FROM "Players" 
        WHERE "userId" = $1 AND "gameId" = $2
      ) 
      AS players 
      INNER JOIN (
        SELECT * FROM "PlayerCards"
      ) 
      AS p_cards 
      ON player_id = "playerId"
    ) 
    AS player_cards 
    INNER JOIN "Cards" 
    ON "Cards".id = "cardId"
    ORDER BY color
  `, [userId, gameId])
  .catch(err => Promise.reject(err));
}

async function createPlayerCard(cardId, playerId) {
  return db.any(`
    INSERT INTO "PlayerCards"("cardId", "playerId")
    VALUES($1, $2)
    RETURNING *
  `, [cardId, playerId])
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

async function deleteAndGetCards(playerId) {
  return db.query(`
    DELETE 
    FROM "PlayerCards"
    WHERE "playerId" = $1
    RETURNING *
  `, [playerId])
  .catch((err) => Promise.reject(err));
}

module.exports = {
  findPlayerCardsByUserId,
  createPlayerCard,
  verifyPlayerCard,
  removePlayerCard,
  findCardCount,
  findPlayerCards,
  findPlayerCardIdsAndDelete,
  deleteAndGetCards
};