const jwt = require('jsonwebtoken');
const { findUserById } = require('../../db/dao/users');

function generateToken(id) {
  return jwt.sign({ id }, process.env.SECRET_AUTH_TOKEN, {
    algorithm: 'HS256',
    expiresIn: '6h' 
  });
}

/* Use to LOCK OUT unauthenticated users. DENIES unauthenticated users*/
async function authenticate(req, res, next) {
  const { token } = req.cookies;
  if (token) {
    await jwt.verify(token, process.env.SECRET_AUTH_TOKEN, { algorithms: ['HS256'] }, async (error, data) => {
      if (!error) {
        const user = await findUserById(data.id);
        if (user) {
          req.user = user;
          return next();
        }
      }
      // unauthorized! redirect to login
      res.redirect('/login');
    })
  } else {
    // unauthorized! redirect to login
    res.redirect('/login');
  }
}

/* Use to only check authentication. ALLOWS unauthenticated users through */
async function verifyToken(req, res, next) {
  const { token } = req.cookies;
  if (token) {
    await jwt.verify(token, process.env.SECRET_AUTH_TOKEN, { algorithms: ['HS256'] }, async (error, data) => {
      if (!error) {
        const user = await findUserById(data.id);
        if (user) req.user = user;
      }
    });
  }
  next();
}

async function parseToken(token) {
  return await jwt.verify(token, process.env.SECRET_AUTH_TOKEN, { algorithms: ['HS256'] }, async (error, data) => {
    if (!error) {
      return await findUserById(data.id);
    } else return null;
  })
}

module.exports = {
  generateToken,
  authenticate,
  verifyToken,
  parseToken
};