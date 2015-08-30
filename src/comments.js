"use strict";

var auth = require('../auth')
    , db = require('../model')
    , async = require('async');

module.exports = function (app) {
    app.post('/remove_comment', auth.allow(['admin', 'user']), function (req, res) {
        // Find it
        async.waterfall([
            function (callback) {
                db.Comment.find({
                    where: { id: req.body.id },
                    include: [{
                        model: db.Article,
                        /**
                         * Make sure only the comments of an article that belong
                         * to the logged in user can be deleted.
                         */
                        include: [{
                            model: db.Domain,
                            include: [{
                                model: db.User,
                                where: { id: req.user.id }
                            }]
                        }]
                    }]
                }).then(function (comment) {
                    if (comment) {
                        callback(null, comment);
                    } else {
                        callback(new Error("Comment does not belong to one of your articles"));
                    }
                }).catch(function (error) {
                    callback(error);
                });
            },

            // Delete it
            function (comment, callback) {
                comment.destroy().then(function () {
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

    app.get('/comments/:id', auth.allow(['admin', 'user']), function (req, res, next) {
        async.waterfall([
            function (callback) {
                db.Comment.findAll({
                    order: [['createdat', 'DESC']],
                    include: [{
                        model: db.Article,
                        where: { id: req.params.id },
                        /**
                         * Make sure only the comments of an article that belong
                         * to the logged in user can be displayed.
                         */
                        include: [{
                            model: db.Domain,
                            include: [{
                                model: db.User,
                                where: { id: req.user.id }
                            }]
                        }]
                    }]
                }).then(function (comments) {
                    callback(null, comments);
                }).catch(function (error) {
                    callback(error);
                });
            }
        ], function (error, comments) {
            if (error) {
                next(error);
            } else {
                res.render('pages/index', {
                    template: 'comments',
                    data: {
                        comments: comments
                    }
                });
            }
        });
    });
}