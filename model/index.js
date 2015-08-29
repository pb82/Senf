"use strict";

var Sequelize = require('sequelize')
		, path = require('path')
		, logger = require('../logger')
		, config = require('../config').database;

var database = new Sequelize(config.filename, null, null, {
	storage: path.join(__dirname, '..', config.filename),
	dialect: 'sqlite',
	logging: config.logSql && logger
});

var User = require('./user')(database, Sequelize);
var Domain = require('./domain')(database, Sequelize);
var Article = require('./article')(database, Sequelize);
var Comment = require('./comment')(database, Sequelize);

Domain.belongsTo(User, { onDelete: 'cascade' });
User.hasMany(Domain);

Article.belongsTo(Domain, { onDelete: 'cascade' });
Domain.hasMany(Article);

Comment.belongsTo(Article, { onDelete: 'cascade' });
Article.hasMany(Comment);

exports.database = database;
exports.User = User;
exports.Domain = Domain;
exports.Article = Article;
exports.Comment = Comment;

/**
 * Initializes the database and orm. Schema generation is performed
 * in case the database has not already been created.
 * @param callback function to invoke after database persistence
 * has been set up
 */
exports.sync = function (callback) {
    database.sync({force: false}).then(callback, function (error) {
    	logger.error('Error synchronizing database', error);
    });
};