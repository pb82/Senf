"use strict";

module.exports = {
	// Server
	port: 3000,
	sessionSecret: 'Please change this!',

	// Logging
	logger: {
		console: {
			enabled: true,
			colorize: true,
			level: 'info'
		}
	},

	// Database (sqlite is the oppinionated choice)
	database: {
		logSql: false,
		filename: 'senf.db'
	},

	// User and account related config
	accounts: {
		enforcePasswordPolicy: false,
		maxCommentLength: 10
	}
}