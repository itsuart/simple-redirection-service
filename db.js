'use strict';
var sqlite = require('sqlite3').verbose();

module.exports = function(connectionString){
    var db = new sqlite.Database(connectionString);

    db.run('CREATE TABLE IF NOT EXISTS Redirect (' +
           'id INTEGER PRIMARY KEY NOT NULL,' +
           'whenText TEXT NOT NULL,' +
           'who TEXT NOT NULL,' +
           'url TEXT NOT NULL);');

    var result = {};

    result.getRedirectUrl = function (cb){
        db.get('SELECT url FROM Redirect ORDER BY id DESC LIMIT 1;', (err, row) => {
            if (err) {
                return cb(err, null);
            }
            if (row) {
                return cb(null, row.url);
            } else {
                return cb(null, null);
            }
        });
    };

    result.setRedirectUrl = function (url, who, cb){
        db.run('INSERT INTO Redirect (whenText, who, url) VALUES (?, ?, ?);',
               new Date().toUTCString(), who, url, cb)
    };

    result.getLast10Redirects = function (cb){
        db.all('SELECT * FROM Redirect ORDER BY id DESC LIMIT 10;', cb);
    };
    
    return result;
};

