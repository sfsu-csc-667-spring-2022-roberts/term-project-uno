require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { create } = require('express-handlebars');

const IndexError = require('./helpers/error/IndexError');
const { verifyToken } = require('./lib/utils/token');
const testRouter = require('./routes/test');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// create hbs instance with options
const hbs = create({
  helpers: {
    equals(a, b, options) {
      if (a === b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
  }
})

// view engine setup
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.use('/', indexRouter);
app.use('/test', testRouter);
app.use('/api/users', usersRouter);
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
  if (err instanceof IndexError) {
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
