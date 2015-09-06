"use strict";

/**
 * Entry point. Requires `server.js` and executes the
 * run function.
 */

var config = require('./config');

require('./server').run(function () {
    require('./logger')('Senf', require('./package').version, 'running on port', config.port);
});