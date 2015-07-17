"use strict";

var database = require('../model')
		,	Q = require('q');

exports.getRegistrationStatus = function () {
	return Q.Promise(function (resolve, reject) {
  	database.User.count({
  		where: {
  			role: 'admin'
  		}
  	}).then(function (count) {
			resolve(count);
  	}).catch(function (error) {
  		reject(error);
  	});
	});
};