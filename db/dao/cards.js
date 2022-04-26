const db = require('../index');

async function getAllCards() {
  return db.query(`
  SELECT *
  FROM $1:name`, [`Cards`])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function getAllSpecialCards() {
  return db.query(`
  SELECT *
  FROM $1:name
  WHERE "special"=true`, [`Cards`])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function getAllNormalCards() {
  return db.query(`
  SELECT *
  FROM $1:name
  WHERE "special"=false`, [`Cards`])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((err) => Promise.reject(err));
}

async function getCard(id) {
  return db.any(`
  SELECT *
  FROM "Cards"
  WHERE "id" = $1
  `, [id])
  .then((results) => {
    if (results && results.length === 1) {
      return Promise.resolve(results[0]);
    } else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  getAllCards,
  getAllSpecialCards,
  getAllNormalCards,
  getCard
};