"use strict";

var db = require('./model')
    , LocalStrategy = require('passport-local')
    , hash = require('password-hash')
    , logger = require('./logger')
    , passport = require('passport');

module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/login', function (req, res) {
        res.render('pages/index', {
            template: 'login',
            data: {}
        });
    });

    // Login route (returns user json on success)
    app.post('/login',
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login'
        }));

    // Logout route
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    /**
     * Configure the local strategy:
     * User credentials are stored in the app database.
     * Other authentication providers (mozilla, google, facebook) might
     * be added in the future.
     */
    passport.use('local',
        new LocalStrategy(function (username, password, done) {
            db.User.find({where: {email: username}}).then(function (user) {
                if (!user) {
                    return done(null, false);
                }

                logger('Authentication pending for', user.username);
                if (!hash.verify(password, user.password)) {
                    logger('Authentication unsuccessful for', user.username);
                    return done(null, false);
                }

                // Update last login timestamp
                user.updateAttributes({
                    last_login: new Date()
                }).then(function () {
                    return done(null, user);
                }).catch(function () {
                    // Ignore the very theoretical error here
                    return done(null, user);
                })
            });
        }));

    /**
     * Users are uniquely identified by their primary key
     * (id)
     */
    passport.serializeUser(function (user, done) {
        logger('User -> Id (%d)', user.id);
        return done(null, user.id);
    });

    /**
     * To deserialize a user we can likewise use the id and just
     * load the user from the db
     */
    passport.deserializeUser(function (id, done) {
        logger('Id -> User (%d)', id);
        db.User.find({where: {id: id}}).then(function (user) {
            return done(null, user);
        }).catch(function (error) {
            return done(error);
        });
    });
};

/**
 * Middleware to ensure authentication of routes on the
 * server side. The allowed roles have to be passed in as
 * an array of strings with the role names
 * @param roles Array of allowed roles
 * @returns {*}
 */
module.exports.allow = function (roles) {
    return function (req, res, next) {
        if (req.isAuthenticated() && roles.indexOf(req.user.role) >= 0) {
            return next();
        } else {
            return res.render('pages/index', {
                template: 'login'
            });
        }
    };
};