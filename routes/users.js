require('dotenv').config();
const express = require('express');
const multer = require('multer');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const UserDao = require('../db/dao/users');
const UserError = require('../helpers/error/UserError');
const { generateToken, authenticate } = require('../lib/utils/token');
const { validateRegister, validateLogin, validateChangeUsername,
  validateChangePassword } = require('../lib/validation/users');

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    bucket: process.env.AWS_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, new Date().toISOString() + '-' + file.originalname)
    }
  })
})
const router = express.Router();

/* Change user information */
router.patch('/', authenticate, async (req, res) => {
  if (req.body.username && req.body.password) {
    const { error } = validateChangeUsername(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const oldUsername = req.user.username;
    const newUsername = req.body.username;
    const { password } = req.body;

    UserDao.usernameExists(newUsername).then((uniqueName) => {
      if (uniqueName) {
        return UserDao.changeUsername(oldUsername, newUsername, password);
      } else throw new UserError('Username is already taken', 409);
    })
    .then((userId) => {
      if (userId > 0) {
        return res.status(204).send();
      } else throw new UserError('Could not change username. Try again later', 500);
    })
    .catch((err) => {
      if (err instanceof UserError) {
        return res.status(err.getStatus()).json({ message: err.getMessage() });
      }
      console.error(err);
      return res.status(500).json({ message: 'An unexpected error occured' });
    });
  } else {
    const { error } = validateChangePassword(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword === confirmNewPassword) {
      UserDao.changePassword(req.user.username, oldPassword, newPassword)
      .then((userId) => {
        console.log(userId);
        if (userId > 0) {
          return res.status(204).send();
        } else throw new UserError('Could not change password. Try again later', 500);
      })
      .catch((err) => {
        if (err instanceof UserError) {
          return res.status(err.getStatus()).json({ message: err.getMessage() });
        }
        console.error(err);
        return res.status(500).json({ message: 'An unexpected error occrued' });
      })
    } else res.status(400).json({ message: 'New password and confirm password do not match'});
  }
});

/* User registration */
router.post('/', async (req, res) => {
  const { error } = validateRegister(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, password, confirmPassword } = req.body;
  UserDao.usernameExists(username).then((uniqueName) => {
    if (uniqueName) {
      if (password === confirmPassword) {
        return UserDao.create(username, password); 
      } else throw new UserError('Password and confirm password do not match', 400);
    } 
    else throw new UserError('Username is already taken', 409);
  })
  .then((userId) => {
    if (userId > 0) {
      return res.redirect('/login');
    } else throw new UserError('An error occured when creating the user', 500);
  })
  .catch((err) => {
    if (err instanceof UserError) {
      return res.status(err.getStatus()).json({ message: err.getMessage() });
    } 
    console.error(err);
    return res.status(500).json({ message: 'An unexpected error occured' });
  });
});

router.post('/login', async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, password } = req.body;
  UserDao.authenticate(username, password)
  .then((userId) => {
    if (userId > 0) {
      const token = generateToken(userId);
      res.cookie('token', token, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
      res.redirect('/');
    } else throw new UserError('Invalid username and/or password', 400);
  })
  .catch((err) => {
    if (err instanceof UserError) {
      return res.status(err.getStatus()).json({ message: err.getMessage() });
    }
    console.error(err);
    return res.status(500).json({ message: 'An unexpected error occured' });
  })
});

router.post('/logout', authenticate, async(req, res) => {
  res.cookie('token', '', { httpOnly: true, maxAge: 1});
  return res.json();
});

/* Get authenticated user info */
router.get('/me', authenticate, async (req, res) => {
  res.redirect(`/${req.user.username}`);
});


router.post('/upload', authenticate, upload.single('file'), async(req,res) => {
  return res.json(req.file.key);
});

router.patch('/avatar', authenticate, async(req,res) => {
  const userId = req.user.id;
  const { key } = req.body;
  const bucketParams = {Bucket: process.env.AWS_BUCKET, Key: ""};
  UserDao.findUserById(userId)
  .then((result) => {
    if((result)) {
      if(result.pictureUrl) {
        bucketParams.Key = result.pictureUrl;
        s3.getObject(bucketParams).promise()
        .then(async ()=> {
          await s3.deleteObject(bucketParams).promise();
          s3.getObject(bucketParams).promise()
          .then(() => {
            return res.status(500).json({ message: 'Object failed to delete' });
          })
          .catch(async(error) => {
            if(error.code == "NoSuchKey") {
              return await UserDao.changeAvatar(key,userId);
            }
            else return res.status(500).json({ message: 'An unexpected error occured' });
          })
          .then((userId) => {
              if (userId > 0) {
                return res.status(204).send();
              } else throw new UserError('Could not change profile picture. Try again later', 500);
          })
        })
      }
      else {
        UserDao.changeAvatar(key,userId)
        .then((userId) => {
            if (userId > 0) {
              return res.status(204).send();
            } else throw new UserError('Could not change profile picture. Try again later', 500);
        })
      }
    }
    else throw new UserError('Could not find user.', 400);
  })
  .catch((err) => {
    if (err instanceof UserError) {
      return res.status(err.getStatus()).json({ message: err.getMessage() });
    }
    else if (err.code == "NoSuchKey") {
      return es.status(500).json({ message: 'Key to delete is invalid.' });
    }
    console.error(err);
    return res.status(500).json({ message: 'An unexpected error occured' });
  });
});

module.exports = router;
