const db = require('../index');

async function createGame(currentColor, lobbyId){
  return db.any(`
  INSERT INTO $1:name($2:name, "turnIndex", "playerOrderReversed", "active", $3:name)
  VALUES($4, $5, $6, $7, $8)
  RETURNING *`,
  ['Games', 'currentColor', 'lobbyId', currentColor, 0, false, true, lobbyId])
.then((result) => {
  if (result) {
    return Promise.resolve(result[0]);
  } else return Promise.resolve(null);
})
.catch((err) => Promise.reject(err));
}

module.exports = {
  createGame,
};