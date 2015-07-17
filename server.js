"user strict";

var express = require('express')
		, config = require('./config')
		, database = require('./model')
		, logger = require('./logger');

var Senf = express();

// Static assets
Senf.use(express.static(__dirname + '/public'));

// App config
Senf.use(require('body-parser').urlencoded({ extended: true }));
Senf.use(require('body-parser').json());
Senf.use(require('cookie-parser')())
Senf.use(require('express-session')({
	secret: config.sessionSecret,
	saveUninitialized: true,
	resave: true
}));

Senf.set('view engine', 'ejs');

// Setup routes
require('./routes')(Senf);

// Reply 404 to all unmatched requests
Senf.get('*', function (req, res, next) {
	res.render('pages/error/404');
});

// Start server
database.sync(function () {
	Senf.listen(config.port, function () {
		logger('Senf running on port', config.port);
	})
});