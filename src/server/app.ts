const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();

const api = require('./routes/api');

const ser = express();

ser.use(logger('dev'));
ser.use(express.json());
ser.use(express.urlencoded({ extended: false }));
ser.use(cookieParser());
ser.use(express.static(path.join(__dirname, 'public')));

ser.get('/', function(req, res, next){
  res.sendfile('./public/index.html');
});

ser.use('/api', api);

// catch 404 and forward to error handler
ser.use(function(req, res, next) {
  next(createError(404));
});

// error handler
ser.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({err});
});

module.exports = ser;
