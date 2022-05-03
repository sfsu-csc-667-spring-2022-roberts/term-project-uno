const db = require('../index');

async function getAllCards() {
  return db.query(`
    SELECT *
    FROM "Cards"
  `, [])
  .catch((err) => Promise.reject(err));
}

async function getAllSpecialCards() {
  return db.query(`
    SELECT *
    FROM "Cards"
    WHERE special = TRUE
  `, [])
  .catch((err) => Promise.reject(err));
}

async function getAllNormalCards() {
  return db.query(`
    SELECT *
    FROM "Cards"
    WHERE special = FALSE
  `, [])
  .catch((err) => Promise.reject(err));
}

async function getCard(id) {
  return db.any(`
    SELECT *
    FROM "Cards"
    WHERE "id" = $1
  `, [id])
  .then((cards) => {
    if (cards && cards.length === 1) {
      return Promise.resolve(cards[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  getAllCards,
  getAllSpecialCards,
  getAllNormalCards,
  getCard
};