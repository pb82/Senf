"use strict";

var logger = require('./logger');

exports.errorHandler = function (res) {
	return function (error) {
		logger.error(error);
		res.render('pages/error/500', error);
	};
};