const db = require('../index');

async function findPlayers(userId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, ['Players', 'userId', userId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  findPlayers,
}