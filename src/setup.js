"use strict";

var db = require('../model')
    , config = require('../config')
    , validator = require('validator')
    , hash = require('password-hash')
    , createPolicy = require('password-sheriff')
    , async = require('async');

/**
 * The password policy is:
 * At least 8 characters in length
 * Contain at least 3 of the following 4 types of characters:
 * lower case letters (a-z)
 * upper case letters (A-Z)
 * numbers (i.e. 0-9)
 */
var policy = createPolicy('good');

function countAdminUsers(callback) {
    db.User.count({
        where: {
            role: 'admin'
        }
    }).then(function (count) {
        callback(null, count);
    }).catch(function (error) {
        callback(error);
    });
}

module.exports = function (app) {
    /**
     * Before any real routing takes place we must ensure that
     * the setup process has been completed. If not, redirect
     * the user to the setup page.
     */
    app.get('*', function (req, res, next) {
        /**
         * API routes must not go through the setup
         * process
         */
        if (/^\/api\//.test(req.path)) {
            return next();
        }

        async.waterfall([
            /**
             * If there is at least one admin user present, the application
             * has been set up. Otherwise the user must create an admin
             * account on this point.
             */
            countAdminUsers
        ], function (error, count) {
            if (error) {
                next(error);
            } else {
                if (count == 0) {
                    // Always render the setup page, regardles of the route
                    res.render('pages/index', {
                        template: 'setup',
                        data: {}
                    });
                } else {
                    next();
                }
            }
        });
    });

    /**
     * User submits the initial setup form (E-mail, password and
     * repetition). Validate inputs and create admin account.
     */
    app.post('/setup', function (req, res) {
        var enforcePolicy = config.accounts.enforcePasswordPolicy;

        async.waterfall([
            countAdminUsers,

            /**
             * Do not run the setup code if there is already an admin user
             * present. Otherwise this could be exploited to create arbitrary
             * admin users
             */
            function (count, callback) {
                if (count !== 0) {
                    return callback("Setup already completed");
                }

                callback(null);
            },

            function (callback) {
                /**
                 * Checking for the prescence of the properties in the request
                 * should not be necessary because they are required in html.
                 * However older browsers may not have this feature.
                 */
                if (!req.body.email) {
                    callback("E-mail required");
                } else if (!req.body.password1 || !req.body.password2) {
                    callback("Password required");
                } else if (req.body.password1 !== req.body.password2) {
                    callback("Passwords do not match");
                } else if (!validator.isEmail(req.body.email)) {
                    callback("Invalid E-mail");
                } else if (enforcePolicy && !policy.check(req.body.password1)) {
                    callback("Password not strong enough");
                } else {
                    callback(null);
                }
            },

            /**
             * Check if a user with the same E-mail is already present. This is not
             * strictly necessary at setup, because usually there are no users in the
             * system yet. However the admin may have deleted himself while other users
             * where already created.
             * @param callback
             */
            function (callback) {
                db.User.count({
                    where: {
                        email: req.body.email
                    }
                }).then(function (result) {
                    if (result === 0) {
                        callback(null);
                    } else {
                        callback("Another user with the same E-mail exists");
                    }
                }).catch(function (error) {
                    callback(error.message || error);
                });
            },

            /**
             * When we reach this point, the admin user can be created
             * because all credentials have been validated.
             * @param callback
             */
            function (callback) {
                db.User.create({
                    role: 'admin',
                    email: req.body.email,
                    password: hash.generate(req.body.password1),
                    last_login: new Date()
                }).then(function (_) {
                    callback(null);
                }).catch(function (error) {
                    callback(error.message || error);
                });
            }
        ], function (error, _) {
            if (error) {
                var templateData = req.body;
                templateData.errormsg = error;

                res.render('pages/index', {
                    template: 'setup',
                    data: templateData
                });
            } else {
                res.redirect('/');
            }
        });
    });
};