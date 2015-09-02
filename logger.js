"use strict";

var winston = require('winston')
		, config = require('./config').logger;

// Setup
var logger = new (winston.Logger)({
	colors: {
  	info: 'green',
    warn: 'yellow',
    error: 'red',
    debug: 'blue'
  }
});

// Console logging enabled?
if (config.console.enabled) {
	logger.add(winston.transports.Console, {
		level: config.console.level || 'info',
  	colorize: config.console.colorize
	});
}

// Export a function that will log infos by default
module.exports = function () {
	logger.info.apply(null, Array.prototype.slice.call(arguments));
};

// Export the other log level functions
module.exports.info = logger.info;
module.exports.warn = logger.warn;
module.exports.error = logger.error;
module.exports.debug = logger.debug;

