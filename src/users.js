"use strict";

var auth = require('../auth')
    , db = require('../model')
    , moment = require('moment')
    , async = require('async');

module.exports = function (app) {
    app.get('/users', auth.allow(['admin']), function (req, res, next) {
        async.waterfall([
            function (callback) {
                db.User.findAll().then(function (users) {
                    callback(null, users);
                }).catch(function (error) {
                    callback(error);
                });
            }
        ], function (error, users) {
            if (error) {
                next(error);
            } else {
                res.render('pages/index', {
                    template: 'users',
                    data: {
                        users: users,
                        moment: moment
                    }
                });
            }
        });
    });
}