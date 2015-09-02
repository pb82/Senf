var config = require('./config')
    , version = require('./package').version
    , logger = require('./logger');

require('./server').run(function () {
    logger('Senf',version, 'running on port', config.port);
});