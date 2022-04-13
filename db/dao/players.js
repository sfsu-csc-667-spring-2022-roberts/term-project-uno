const db = require('../index');

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
}

module.exports = {
  createPlayer
};