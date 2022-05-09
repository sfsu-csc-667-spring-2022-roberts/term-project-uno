require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { create } = require('express-handlebars');

const { verifyToken } = require('./lib/utils/token');
const IndexError = require('./helpers/error/IndexError');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const lobbiesRouter = require('./routes/lobbies');
const gamesRouter = require('./routes/games');

const app = express();

const hbs = create({
  helpers: {
    equals(a, b, options) {
      if (a === b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    varEquals(varName, value, options) {
      if (options.data.root[varName] === value) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    inc(value, options) {
      return parseInt(value) + 1;
    },
    loopTimes(n, options) {
      let accum = '';
      for(let i = 0; i < n; i++) {
        accum += options.fn(i);
      }
      return accum;
    },
    assign(varName, varValue, options) {
      options.data.root[varName] = varValue;
    },
    get(varName, options) {
      return options.data.root[varName];
    }
  }
})

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

if (process.env.NODE_ENV === 'development') app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/lobbies', lobbiesRouter);
app.use('/api/games', gamesRouter);
app.use(verifyToken);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(async (err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (err instanceof IndexError) {  // render error page with custom message
    res.render('error', { 
      layout: false, 
      status: err.status || 500,
      message: err.message,
      authenticated: req.user != undefined,
      user: req.user
    });
  } else {
    res.render('error', { 
      layout: false, 
      status: err.status || 500, 
      authenticated: req.user != undefined,
      user: req.user
    });
  }

  if (!err.status || err.status === 500) {
    console.error(err);
  }
});

module.exports = app;
