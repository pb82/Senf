var Senf = require('../server')
    , request = require('supertest')
    , config = require('../config')
    , path = require('path')
    , fs = require('fs');

describe('setup', function () {
    var user = null;
    var dbPath = path.join(__dirname, '..', config.database.testFilename);

    before(function (done) {
        Senf.run(function (instance) {
            user = request.agent(instance);
            done();
        })
    });

    after(function (done) {
        // Remove the test database once the test has finished
        fs.unlinkSync(dbPath);
        done();
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
        user.get('/')
            .expect(200)
            .end(function (err, res) {
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
        user.post('/setup')
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

    it('should not be possible to make unauthenticated requests', function (done) {
        user.get('/domains')
            .expect(302)
            .expect('Moved Temporarily. Redirecting to /login')
            .end(function (err, res) {
                if (!err) {
                    done();
                } else {
                    throw new Error("Request could be made without authenticating");
                }
            });
    });

    it('should fail to login with wrong credentials', function (done) {
        user.post('/login')
            .send({
                username: 'peter-braun@gmx.net',
                password: 'asdfASDF123!"',
            })
            .expect(302)
            .expect('Moved Temporarily. Redirecting to /login')
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });

    it('should succeed to login with correct credentials', function (done) {
        user.post('/login')
            .send({
                username: 'peter-braun@gmx.net',
                password: 'asdfASDF123!"§',
            })
            .expect(302)
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    if (res.text.indexOf('Redirecting to /') >= 0) {
                        done();
                    } else {
                        throw new Error("Login with correct credentials was not possible");
                    }
                }
            });
    });

    it('should fail to create invalid domains', function (done) {
        user.post('/domains')
            .send({
                name: 'obviously invalid domain name'
            })
            .expect(500)
            .expect('Invalid domain name')
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });

    it('should succeed to create valid domains', function (done) {
        user.post('/domains')
            .send({
                name: 'peter-braun.name'
            })
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });

    it('should not accept comments of invalid users', function (done) {
        user.post('/api/v1/comments')
            .set('referer', 'http://localhost/')
            .send({
                user: 'obviously invalid user',
                author: 'Testauthor',
                text: 'Test'
            })
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });

    it('should not accept comments of invalid domains', function (done) {
        user.post('/api/v1/comments')
            .set('referer', 'http://localhost/')
            .send({
                user: 'peter-braun@gmx.net',
                author: 'Testauthor',
                text: 'Test'
            })
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });

    it('should accept comments when user and domain are correct', function (done) {
        user.post('/api/v1/comments')
            .set('referer', 'http://peter-braun.name/')
            .send({
                user: 'peter-braun@gmx.net',
                author: 'Testauthor',
                text: 'Test'
            })
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });

    it('should be able to retrieve existing comments', function (done) {
        user.get('/api/v1/comments?user=peter-braun@gmx.net')
            .set('referer', 'http://peter-braun.name/')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    var comments = JSON.parse(res.text);
                    if (comments.length === 1) {
                        done();
                    } else {
                        throw new Error("Number of comments should be one")
                    }
                }
            });
    });

    it('should succeed to log out', function (done) {
        user.get('/logout')
            .expect(302)
            .expect('Moved Temporarily. Redirecting to /')
            .end(function (err, res) {
                if (err) {
                    throw err;
                } else {
                    done();
                }
            });
    });

});