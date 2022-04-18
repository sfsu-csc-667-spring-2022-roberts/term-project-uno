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
}

module.exports = {
  createPlayerCard
};