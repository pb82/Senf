var Senf = require('../server')
    , request = require('supertest')
    , config = require('../config')
    , path = require('path')
    , fs = require('fs');

describe('setup', function () {
    var app = null;
    var dbPath = path.join(__dirname, '..', config.database.testFilename);

    before(function (done) {
        fs.unlinkSync(dbPath);
        Senf.run(function (instance) {
            app = instance;
            done();
        })
    });

    it('should create the database file on startup', function (done) {
        fs.exists(dbPath, function (result) {
            if (result) {
                done();
            } else {
                throw new Error(config.database.testFilename + " not found");
            }
        });
    });

    it('should start the setup process for a fresh database', function (done) {
        request(app).get('/').expect(200).end(function (err, res) {
            if (err) {
                throw err;
            } else {
                if (res.text.indexOf('This seems to be your first time around') > 0) {
                    done();
                } else {
                    throw new Error("Did not enter the setup process");
                }
            }
        });
    });

    it('should allow the user to create an admin account', function (done) {
        request(app)
            .post('/setup')
            .send({
                email: 'peter-braun@gmx.net',
                password1: 'asdfASDF123!"§',
                password2: 'asdfASDF123!"§'
            })
            .expect(302)
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });
});