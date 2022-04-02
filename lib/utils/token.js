const jwt = require('jsonwebtoken');
const { findUserById } = require('../../db/dao/users');

function generateToken(id) {
  return jwt.sign({ id }, process.env.SECRET_AUTH_TOKEN, { expiresIn: '6h' });
}

async function verifyToken(token) {
  return await jwt.verify(token, process.env.SECRET_AUTH_TOKEN, async (error, data) => {
    if (error) return Promise.resolve(false);
    else {
      const user = await findUserById(data.id);
      return Promise.resolve(user != undefined);
    }
  });
}

async function authenticate(req, res, next) {
  const { token } = req.cookies;
  if (token) {
    await jwt.verify(token, process.env.SECRET_AUTH_TOKEN, async (error, data) => {
      if (error) {
        return res.status(401).json({ message: 'Invalid token' });
      } else {
        const user = await findUserById(data.id);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token'});
        }
        req.user = user;
        next();
      };
    })
  } else {
    res.status(401).json({ message: 'Missing auth token' });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate
};