"use strict";

module.exports = function (orm, types) {
	return orm.define('user', {
  	email:      types.STRING,
    password:   types.STRING,
    role:       types.ENUM('admin', 'user'),
    last_login: types.DATE
	});
};