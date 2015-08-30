"use strict";

var db = require('../../../model')
    , url = require('url')
    , logger  = require('../../../logger')
    , config = require('../../../config')
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
                where: { name: urlParts.hostname }
            }]
        }).then(function (user) {
            if (user) {
                callback(null, user);
            } else {
                // Send a useful errormessage to the frontend
                callback([
                    "Domain or user not found (",
                    urlParts.hostname,
                    " / ",
                    email,
                    ")"
                ].join(''));
            }
        }).catch(function (error) {
            callback(error);
        });
    }
}

/**
 * Make sure the request domain is owned by the request
 * user (identified by email)
 */
function findDomain(urlParts) {
    return function (user, callback) {
        for (var i = 0; i < user.domains.length; i++) {
            if (user.domains[i].name === urlParts.hostname) {
                return callback(null, user.domains[i]);
            }
        }

        callback([
            "The user '",
            user.email,
            "' does not own domain '",
            urlParts.hostname,
            "'"
        ]);
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

/**
 * Error objects are thrown by libraries and have to be logged as proper
 * errors. String are ttreated as warnings.
 */
function handleError(error) {
    if (error instanceof Error) {
        logger.error(error);
    } else if (error) {
        logger.warn(error);
    }
}

module.exports = function (app) {
    /**
     * Post a new comment by submitting author and comment text. All other relevant
     * parameters are cotained in the request referer.
     */
    app.post('/api/v1/comments', cors(), function (req, res) {
        var urlParts = url.parse(req.headers.referer);

        async.waterfall([
            function (callback) {
                if (!validator.isLength(req.body.text, 1, config.accounts.maxCommentLength)) {
                    callback([
                        "Comments must be between 1 and ",
                        config.accounts.maxCommentLength,
                        " characters in length"
                    ].join(''));
                } else {
                    callback(null);
                }
            },

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
            handleError(error);
            if (error) {
                res.sendStatus(400);
            } else {
                res.json(comment);
            }
        });
    });

    /**
     * Get comments by sending the user email. All other relevant parameters
     * are contained in the request referer.
     */
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
            handleError(error);
            if (error) {
                res.sendStatus(400);
            } else {
                res.json(comments);
            }
        });
    });
}