"use strict";

var auth = require('../auth')
    , db = require('../model')
    , async = require('async');

module.exports = function (app) {
    app.get('/articles/:id', auth.allow(['admin', 'user']), function (req, res, next) {
        async.waterfall([
            function (callback) {
                db.Article.findAll({
                    order: [['createdat', 'DESC']],
                    include: [{
                        model: db.Domain,
                        where: { id: req.params.id },
                        /**
                         * Make sure that users can only see their own
                         * articles
                         */
                        include: [{
                            model: db.User,
                            where: { id: req.user.id }
                        }]
                    }]
                }).then(function (articles) {
                    callback(null, articles);
                }).catch(function (error) {
                    callback(error);
                });
            }
        ], function (error, articles) {
            if (error) {
                next(error);
            } else {
                res.render('pages/index', {
                    template: 'articles',
                    data: {
                        articles: articles
                    }
                });
            }
        });
    });
}