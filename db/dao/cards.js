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

module.exports = {
  getAllCards,
  getAllSpecialCards,
  getAllNormalCards
};