"use strict";

module.exports = function (orm, types) {
    return orm.define('article', {
        name:      types.STRING
    });
};