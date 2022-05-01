const db = require('../index');

async function create(location, height, width) {
  return db.one(`
    INSERT INTO "Avatars"(location, height, width)
    VALUES ($1, $2, $3)
    RETURNING location
  `, [location, height, width])
  .catch((err) => Promise.reject(err));
}

async function find(location) {
  return db.query(`
    SELECT location, height, width,
      (CASE
        WHEN height > width THEN TRUE
        ELSE FALSE
      END) AS portrait
    FROM "Avatars"
    WHERE location = $1
  `, [location])
  .then((avatars) => {
    if (avatars && avatars.length === 1) return Promise.resolve(avatars[0]);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  create,
  find
}