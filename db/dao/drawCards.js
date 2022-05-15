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
async function removeDrawCard(cardId, gameId) {
  return db.any(`
  DELETE
  FROM "DrawCards"
  WHERE "gameId" = $1 AND "cardId" = $2
  `, [gameId, cardId])
    .then((result) => {
      if (result) {
        return Promise.resolve(result);
      } else return Promise.resolve(null);
    })
    .catch((err) => Promise.reject(err));
}

async function findTopOfDrawCards(gameId) {
  return db.any(`
  SELECT * 
  FROM "DrawCards" 
  WHERE "gameId" = $1 
  OFFSET ((SELECT COUNT(*) FROM "DrawCards" WHERE "gameId" = $1)-1)
  `, [gameId])
    .then((results) => {
      if (results && results.length === 1) {
        return Promise.resolve(results[0]);
      } else return Promise.resolve(false);
    })
    .catch((err) => Promise.reject(err));
}

async function findCardCount(gameId) {
  return db.query(`
    SELECT COUNT(*) FROM "DrawCards"
    WHERE "gameId" = $1
  `, [gameId])
    .then((result) => {
      if (result) return Promise.resolve(parseInt(result[0].count));
      else return Promise.resolve(-1);
    })
    .catch((err) => Promise.reject(err));
}

async function resetDrawDeck(gameId) {
  const query1 = `SELECT "cardId" FROM "PlayedCards" WHERE "gameId" = $1 
                  EXCEPT (SELECT "cardId" FROM "PlayedCards" WHERE "gameId" = $1
                  OFFSET ((SELECT COUNT(*) FROM "PlayedCards" WHERE "gameId" = $1 )-1))`;
  const query2 = `DELETE FROM "PlayedCards" WHERE "gameId" = $1 AND "cardId" IN 
                  (SELECT "cardId" FROM "PlayedCards" WHERE "gameId" = $1
                  EXCEPT (SELECT "cardId" FROM "PlayedCards" WHERE "gameId" = $1 
                  OFFSET ((SELECT COUNT(*) FROM "PlayedCards" WHERE "gameId" = $1 )-1)))`;

  return db.query(query1, [gameId])
    .then((results) => {
      if (results && results.length > 1) {        
        while (results.length > 0) {
          const index = Math.floor(Math.random() * results.length);
          createDrawCard(results[index].cardId, gameId)
          results = results.filter((r,i) => i !== index);
        }
        return db.query(query2, [gameId]);
      } else throw new Error("Failed in resetDrawDeck");
    })
    .then((results) => {
      if (results) return Promise.resolve(true);
      else return Promise.resolve(false);
    })
    .catch((err) => {
      Promise.resolve(null)
    });
}


module.exports = {
  createDrawCard,
  removeDrawCard,
  findTopOfDrawCards,
  findCardCount,
  resetDrawDeck
};