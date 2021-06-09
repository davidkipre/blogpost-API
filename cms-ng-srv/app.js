const express = require('express');
const app = express();
const api = require('./api/v1/index');
const auth = require('./auth/routes'); //utilisation du modele user.js

const morgan = require('morgan');
const bodyParser = require('body-parser'); //importer body parser

// to allow request from my Angular test client that use another port
const cors = require('cors');

// passport
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const Strategy = require('passport-local').Strategy;
// to retrieve users from the MongoDB users collection
const User = require('./auth/models/user');

app.use(cookieParser());
//a session needs a secret to create a cookie
app.use(session({
	name: 'david-cookie', //permet de distinguer notre cookie coté client
	resave: true,
	saveUninitialized: true,
	secret: 'my super secret'
	 
}));

app.use(passport.initialize());
app.use(passport.session());

// passport will add a user to the session...
passport.serializeUser((user, cb) => {
	cb(null, user);
});
//...and retrieve it from session
passport.deserializeUser((user, cb) => {
	cb(null, user);
});

// configuring a local strategy 
// == using username and password to identify and authorize a user
passport.use(new Strategy({
	usernameField: 'username',
	passwordField: 'password'
}, (name, pwd, cb) => {
	User.findOne({ username: name }, (err, user) => {
		if (err) {
			console.error(`could not find ${name} in MongoDB`, err);
		}
		if(user.password !== pwd) {
			console.error(`wrong password for ${name}`);
			cb(null, false);
		} else {
			console.error(`${name} found in MongoDB and authenticated`);
			cb(null, user);
		}
	});
}));

//configuration de mongoose
const mongoose = require('mongoose');
const connection = mongoose.connection;

app.set('port', (process.env.port || 3000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//le middleware il fait de tel sorte que le code sois suivi a la lettre app.use
app.use(cors({credentials: true, origin: 'http://localhost:4200'})); //il autorise les appli differentes de communiquer


//indiquez le chemin dans lequel se trouve notre image
const uploadsDir = require('path').join(__dirname,'/uploads');
//verifie ce a quoi on s'attend
console.log('uploadsDir', uploadsDir);
//fournit par express
app.use(express.static(uploadsDir));

app.use('/auth', auth);

app.use('/api/v1', api); //ensuite autorise les requestes venant de notre index.js

app.use(morgan('dev'));

app.use(function (req, res) {
	const err = new Error('404 - Not found');
	err.status = 404;
	res.json(err);
});

mongoose.connect('mongodb://localhost:27017/whiskycms', { useNewUrlParser: true });

connection.on('error', (err) => {
	console.error(`connection to MongoDB error: ${err.message}`); // eslint-disable-line no-console
});

connection.once('open', () => {
  console.log('Connected to MongoDB');
  
app.listen(app.get('port'), function () {
	console.log(`Express server listening on port ${app.get('port')}`);// eslint-disable-line no-console
});
});
