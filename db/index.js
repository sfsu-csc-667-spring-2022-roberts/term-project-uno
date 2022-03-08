const pgp = require('pg-promise')();
const { ConnectionString } = require('connection-string');
const cnObj = new ConnectionString(process.env.DATABASE_URL);
const connection = {
  host: cnObj.hostname,
  port: cnObj.port,
  database: cnObj.path?.[0],
  user: cnObj.user,
  password: cnObj.password,
  ssl: {
    rejectUnauthorized: false,
  },
};
const db = pgp(connection);

module.exports = db;