"user strict";

var express = require('express')
    , config = require('./config')
    , database = require('./model')
    , version = require('./package').version
    , logger = require('./logger');

var Senf = express();

// Static assets
Senf.use(express.static(__dirname + '/public'));
Senf.use(express.static(__dirname + '/bower_components'));

// App config
Senf.use(require('body-parser').urlencoded({ extended: true }));
Senf.use(require('body-parser').json());
Senf.use(require('cookie-parser')());
Senf.use(require('express-session')({
    secret: config.sessionSecret,
    saveUninitialized: true,
    resave: true
}));

// LogicFULL templates
Senf.set('view engine', 'ejs');

// Authentication has to be the first in the middleware chain
require('./auth')(Senf);

// Inject app version and user for templates
Senf.use(function (req, res, next) {
    res.locals.loggedIn = !(req.user === undefined);
    res.locals.version = version;
    res.locals.user = req.user;
    next();
});

// App modules
require('./src/setup')(Senf);
require('./src/dashboard')(Senf);
require('./src/users')(Senf);
require('./src/domains')(Senf);
require('./src/articles')(Senf);
require('./src/comments')(Senf);
require('./src/api/v1/comments')(Senf);

// Reply 404 to all unmatched requests
Senf.get('*', function (req, res, _) {
    res.render('pages/index', {
        template: 'error/404'
    });
});

// Catch errors
Senf.use(function (err, req, res, _) {
    logger.error(err);
    res.render('pages/index', {
        template: 'error/500',
        message: err.message || err
    });
});

exports.run = function (callback) {
    database.sync(function () {
        Senf.listen(config.port, function () {
            callback(Senf);
        })
    });
};