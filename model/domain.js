"use strict";

module.exports = function (orm, types) {
    return orm.define('domain', {
        name:      types.STRING
    });
};