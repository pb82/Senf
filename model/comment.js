"use strict";

module.exports = function (orm, types) {
    return orm.define('comment', {
        author: types.STRING,
        text:   types.STRING
    });
};