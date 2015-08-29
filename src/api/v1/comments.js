"use strict";

var auth = require('../../../auth')
    , db = require('../../../model')
    , url = require('url')
    , logger  = require('../../../logger')
    , cors = require('cors')
    , validator = require('validator')
    , escape = require('escape-html')
    , async = require('async');

// Find  a user given a domain
// TODO: make sure no two users can own the same domain
function findUser(email, urlParts) {
    return function (callback) {
        db.User.find({
            where: {email: email},
            include: [{
                model: db.Domain,
                where: {name: urlParts.hostname}
            }]
        }).then(function (user) {
            if (user) {
                callback(null, user);
            } else {
                // Send a useful errormessage to the frontend
                callback(new Error([
                    "Domain or user not found (",
                    urlParts.hostname,
                    " / ",
                    email,
                    ")"
                ].join('')));
            }
        }).catch(function (error) {
            callback(error);
        });
    }
}

// Find a domain object owned by a user given the hostname
function findDomain(urlParts) {
    return function (user, callback) {
        for (var i = 0; i < user.domains.length; i++) {
            if (user.domains[i].name === urlParts.hostname) {
                return callback(null, user.domains[i]);
            }
        }
        callback(new Error("The requested domain does not belong to the user"));
    }
}

/**
 * Find the articles of a domain. If the domain exists, but the requested
 * article does not yet exist, create it.
 */
function findArticle(urlParts) {
    return function (domain, callback) {
        db.Article.find({
            where: {name: urlParts.pathname},
            include: [{
                model: db.Domain,
                where: {id: domain.id}
            }]
        }).then(function (article) {
            if (article) {
                callback(null, article);
            } else {
                db.Article.create({
                    name: urlParts.pathname
                }).then(function (article) {
                    article.setDomain(domain);
                    callback(null, article);
                }).catch(function (error) {
                    callback(error);
                });
            }
        }).catch(function (error) {
            callback(error);
        });
    }
}

module.exports = function (app) {
    app.post('/api/v1/comments', cors(), function (req, res) {
        var urlParts = url.parse(req.headers.referer);

        if (!validator.isLength(req.body.author, 1, 50) ||
            !validator.isLength(req.body.text, 1, 500)) {
            return res.json({
                success: false,
                message: "input too long"
            });
        }


        async.waterfall([
            findUser(req.body.user, urlParts),
            findDomain(urlParts),
            findArticle(urlParts),

            function (article, callback) {
                db.Comment.create({
                    author: escape(req.body.author.trim()),
                    text: escape(req.body.text.trim())
                }).then(function (comment) {
                    comment.setArticle(article);
                    callback(null, comment);
                }).catch(function (error) {
                    callback(error);
                });
            }
        ], function (error, comment) {
            if (error) {
                // Dont leak errors
                logger.error("POST /api/v1/comments", error);
                res.json({
                    success: false,
                    message: "Server error"
                });
            } else {
                res.json({
                    success: true,
                    result: comment
                });
            }
        });
    });

    app.get('/api/v1/comments', cors(), function (req, res) {
        var urlParts = url.parse(req.headers.referer);

        async.waterfall([
            findUser(req.query.user, urlParts),
            findDomain(urlParts),
            findArticle(urlParts),

            function (article, callback) {
                db.Comment.findAll({
                    order: [['createdat', 'DESC']],
                    include: [{
                        model: db.Article,
                        where: {id: article.id}
                    }]
                }).then(function (comments) {
                    callback(null, comments);
                }).catch(function (error) {
                    callback(error);
                });
            }
        ], function (error, comments) {
            if (error) {
                // Dont leak errors
                logger.error("POST /api/v1/comments", error);
                res.json({
                    success: false,
                    message: "Server error"
                });
            } else {
                res.json({
                    success: true,
                    result: comments
                });
            }
        });
    });
}