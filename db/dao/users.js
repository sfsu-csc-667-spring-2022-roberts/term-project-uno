const db = require('../index');
const bcrypt = require('bcrypt');
const { promise } = require('bcrypt/promises');

async function usernameExists(username) {
  return db.query('SELECT id FROM $1:name WHERE username = $2', ['Users', username])
  .then((results) => {
    return Promise.resolve(results && results.length === 0);
  })
  .catch((e) => Promise.reject(e));
}

async function create(username, password) {
  return bcrypt.hash(password, 8)
  .then((hashedPassword) => {
    console.log(hashedPassword);
    return db.any('INSERT INTO $1:name(username, password) VALUES($2, $3) RETURNING id', ['Users', username, hashedPassword]);
  })
  .then((results) => {
    console.log(results);
    if (results && results.length === 1) {
      const userId = results[0].id;
      return Promise.resolve(userId);
    } else return Promise.resolve(-1);
  })
  .catch((err) => Promise.reject(err));
}

async function authenticate(username, password) {
  let userId;
  return db.query('SELECT id, username, password FROM $1:name WHERE username = $2', ['Users', username])
  .then((results) => {
    if (results && results.length === 1) {
      userId = results[0].id;
      return bcrypt.compare(password, results[0].password);
    } else return Promise.resolve(-1);
  })
  .then((passwordsMatch) => {
    if (passwordsMatch) return Promise.resolve(userId);
    return Promise.resolve(-1);
  })
  .catch((e) => Promise.reject(e));
}

async function findUserById(id) {
  return db.query('SELECT * FROM $1:name WHERE id = $2', ['Users', id])
  .then((results) => {
    return Promise.resolve(results);
  })
  .catch((e) => Promise.reject(e));
}

module.exports = {
  usernameExists,
  create,
  authenticate,
  findUserById,
};