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
		filename: 'senf.db',

		// For running the unit tests
		testFilename: 'test.db'
	},

	// User and account related config
	accounts: {
		enforcePasswordPolicy: true,
		maxCommentLength: 500
	}
}
