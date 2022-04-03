const jwt = require('jsonwebtoken');
const { findUserById } = require('../../db/dao/users');

function generateToken(id) {
  return jwt.sign({ id }, process.env.SECRET_AUTH_TOKEN, { expiresIn: '6h' });
}

/* Use to LOCK OUT unauthenticated users. DENIES unauthenticated users*/
async function authenticate(req, res, next) {
  const { token } = req.cookies;
  if (token) {
    await jwt.verify(token, process.env.SECRET_AUTH_TOKEN, async (error, data) => {
      if (!error) {
        const user = await findUserById(data.id);
        if (user && user.length != 0) {
          req.user = user[0];
          return next();
        }
      }
      res.status(401).json({ message: 'Invalid token' });
    })
  } else {
    res.status(401).json({ message: 'Missing auth token' });
  }
}

/* Use to only check authentication. ALLOWS unauthenticated users through */
async function verifyToken(req, res, next) {
  const { token } = req.cookies;
  if (token) {
    await jwt.verify(token, process.env.SECRET_AUTH_TOKEN, async (error, data) => {
      if (!error) {
        const user = await findUserById(data.id);
        if (user && user.length != 0) req.user = user[0];
      }
    });
  }
  next();
}

module.exports = {
  generateToken,
  authenticate,
  verifyToken,
};