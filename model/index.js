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

exports.database = database;
exports.User = User;

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