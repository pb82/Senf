"use strict";

var auth = require('../auth');

module.exports = function (app) {
    app.get('/', function (_, res) {
        res.redirect('/dashboard');
    });

    app.get('/dashboard', auth.allow(['admin', 'user']), function (req, res) {
        res.render('pages/index', {
            template: 'dashboard'
        });
    });
}