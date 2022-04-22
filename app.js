var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql');
const cors = require('cors');
var session = require('express-session');
var flash = require('connect-flash');

var authRouter = require('./routes/auth');
var homeRouter = require('./routes/home');
var adminRouter = require('./routes/admin');
var classroomRouter = require('./routes/classroom');

var app = express();

app.use(
  session({
    secret: 'elearningsecret',
    resave: false,
    saveUninitialized: false,
  })
);


app.use(cors());

//connect database
db = mysql.createConnection({

  user: "root",
  host: "localhost",
  password: "",
  database: "elearning_db",

})

//set

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

app.use('/', authRouter);
app.use('/home', homeRouter);
app.use('/admin', adminRouter);
app.use('/classroom',classroomRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
