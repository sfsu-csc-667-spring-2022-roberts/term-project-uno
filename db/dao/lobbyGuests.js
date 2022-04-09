const db = require('../index');
const bcrypt = require('bcrypt');

const LobbyError = require('../../helpers/error/LobbyError');

async function removeGuest(guestId, id) {

}

async function findGuestLobbies(guestId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE $2:name = $3`, ['LobbyGuests', 'userId', guestId])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  removeGuest,
  findGuestLobbies
};