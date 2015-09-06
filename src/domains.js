"use strict";

var auth = require('../auth')
    , db = require('../model')
    , moment = require('moment')
    , async = require('async');

module.exports = function (app) {
    var domainRegex = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i;

    /**
     * /display domains
     */
    app.get('/domains', auth.allow(['admin', 'user']), function (req, res, next) {
        // Admins can see the domains of any user
        var where = req.user.role === 'admin' ? null : { id: req.user.id};

        async.waterfall([
            function (callback) {
                db.Domain.findAll({
                    order: [['createdat', 'DESC']],
                    include: [{
                        model: db.User,
                        where: where
                    }]
                }).then(function (domains) {
                    callback(null, domains);
                }).catch(function (error) {
                    callback(error);
                });
            }
        ], function (error, domains) {
            if (error) {
                next(error);
            } else {
                res.render('pages/index', {
                    template: 'domains',
                    data: {
                        domains: domains,
                        moment: moment
                    }
                });
            }
        });
    });

    /**
     * submit domain
     */
    app.post('/domains', auth.allow(['admin', 'user']), function (req, res) {
        async.waterfall([
            // Ensure that domains are unique
            function (callback) {
                db.Domain.find({
                    where: { name: req.body.name }
                }).then(function (domain) {
                    if (domain) {
                        callback(new Error("Domain already owned by another user"));
                    } else {
                        callback(null);
                    }
                }).catch(function (error) {
                    callback(error);
                });
            },
            /**
             * Find the user to associate him with the
             * domain
             */
            function (callback) {
                db.User.find({
                    where: { id: req.user.id }
                }).then(function (user) {
                    callback(null, user);
                }).catch(function (error) {
                    callback(error);
                });
            },

             // Check and create the domain
            function (user, callback) {
                // Check again, just to be sure
                if (domainRegex.test(req.body.name) || req.body.name === 'localhost') {
                    db.Domain.create(req.body).then(function (domain) {
                        domain.setUser(user);
                        callback();
                    }).catch(function (error) {
                        callback(error);
                    });
                } else {
                    return callback(new Error("Invalid domain name"));
                }
            }
        ], function (error) {
            if (error) {
                res.status(500).send(error.message);
            } else {
                res.sendStatus(200);
            }
        });
    });

    app.post('/remove_domain', auth.allow(['admin', 'user']), function (req, res) {
        async.waterfall([
            function (callback) {
                // Find the domain
                db.Domain.find({
                    where: { id: req.body.id },
                    include: [db.User]
                }).then(function (domain) {
                    callback(null, domain);
                }).catch(function (error) {
                    callback(error);
                })
            },

            // Check if the domain belongs to the logged-in user
            function (domain, callback) {
                if (domain.user.id !== req.user.id) {
                    callback(new Error("Cannot delete foreign domain"));
                } else {
                    callback(null, domain);
                }
            },

            // Delete it
            function (domain, callback) {
                domain.destroy().then(function () {
                    callback(null);
                }).catch(function (error) {
                    callback(error);
                });
            }
        ], function (error) {
            if (error) {
                res.status(500).send(error.message);
            } else {
                res.sendStatus(200);
            }
        });
    });
}