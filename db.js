'use strict';
var sqlite = require('sqlite3').verbose();

module.exports = function(connectionString){
    var db = new sqlite.Database(connectionString);

    db.run('CREATE TABLE IF NOT EXISTS Redirect (' +
           'id INTEGER PRIMARY KEY NOT NULL,' +
           "route TEXT NOT NULL UNIQUE CHECK(route != '')," +
           "url TEXT NOT NULL CHECK (url != '')," +
           "createdWhen TEXT NOT NULL CHECK (createdWhen != '')," +
           "createdBy TEXT NOT NULL CHECK (createdBy != '')," +
           'description TEXT NOT NULL,' +
           'isActive INTEGER NOT NULL CHECK(isActive == 1 or isActive == 0)' +
           ');');

    db.run('CREATE TABLE IF NOT EXISTS RedirectHistory (' +
           'id INTEGER PRIMARY KEY NOT NULL,' +
           'redirectId INTEGER NOT NULL REFERENCES Redirect(id),' +
           "whenText TEXT NOT NULL CHECK(whenText != '')," +
           "who TEXT NOT NULL CHECK (who != '')," +
           "what TEXT NOT NULL CHECK (what != '')" +
           ');');


    function updateHistory(redirectId, who, what, cb){
        var now = new Date().toUTCString();
        db.run('INSERT INTO RedirectHistory (redirectId, whenText, who, what) VALUES (?, ?, ?, ?);',
               redirectId, now, who, what, cb);
    }

    function getRedirectIdByRoute(route, cb){
        db.get('SELECT id FROM Redirect WHERE route = ? LIMIT 1;', route, (err, row) => {
            if (err) {
                return cb(err);
            }
            var id = row.id;
            cb(null, id);
        });
    }

    return {
        getRedirectIdByRoute: getRedirectIdByRoute,
        
        getRedirectUrl: function(route, cb){
            db.get('SELECT url FROM Redirect WHERE (route = ? AND isActive = 1) LIMIT 1;', route, (err, row) => {
                if (err) {
                    return cb(err, null);
                }
                if (row) {
                    return cb(null, row.url);
                } else {
                    return cb(null, null);
                }
            });
        },

        setRedirectUrl: function(route, url, who, cb){
            var now = new Date().toUTCString();
            db.run ('INSERT INTO Redirect (route, url, createdWhen, createdBy, isActive, description) VALUES (?, ?, ?, ?, 1, "");', route, url, now, who
                    , (err, _) => {
                        if (err) {
                            return cb(err, null);
                        }
                        getRedirectIdByRoute(route, (err, id) => {
                            if (err){
                                return cb(err);
                            }
                            db.run('UPDATE Redirect SET url = ? WHERE id = ?;', url, id, (err, _) => {
                                if (err){
                                    return cb(err);
                                }
                                updateHistory(id, who, `Set redirect for ${route} to ${url}`, (err, _) => {
                                    if (err){
                                        return cb(err);
                                    }
                                    return cb(null, {
                                        id: id,
                                        route: route,
                                        target: url,
                                        enabled: true //TODO: make editable
                                    });
                                });
                            });
                        });
                    });
        },

        getRedirectHistory: function (route, cb){
            
        },

        getActiveRedirects: function(cb){
            db.all('SELECT route, url FROM Redirect WHERE isActive = 1 ORDER BY route LIMIT 100;', cb);
        },

        getAllRedirects: function (cb){
            db.all('SELECT route, url FROM Redirect WHERE isActive = 1 ORDER BY route;', cb);
        },
        
        enableRedirect: function (id, who, cb){
            db.run('UPDATE Redirect SET isActive = 1 WHERE id = ?;', id, (err, _) => {
                if (err) {
                    return cb(err);
                }
                updateHistory(id, who, 'ENABLED redirect', cb);
            });
        },

        disableRedirect: function (id, who, cb){
            var now = new Date().toUTCString();
            db.run('UPDATE Redirect SET isActive = 0 WHERE id = ?;', id, (err, _) => {
                if (err) {
                    return cb(err);
                }
                updateHistory(id, who, 'DISABLED redirect', cb);
            });
        }
    };
};

