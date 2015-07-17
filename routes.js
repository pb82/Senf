"use strict";

var register = require('./src/register')
		, err = require('./utils').errorHandler;


module.exports = function (app) {
	app.get('/', function (_, res) {
		register.getRegistrationStatus()
		.then(function (result) {
			res.render('pages/index', { setupComplete: result > 0 });
		}, err(res));
	});
};