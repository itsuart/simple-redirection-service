'use strict';

var crypto = require('crypto');
var url = require('url');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var sqlite = require('sqlite3').verbose();
var path = require('path');

var cache = require('./cache');
var config = require('./config');

var app = express();

app.use(require('cookie-parser')());
app.use(express.static('static'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'jade');

var db = new sqlite.Database(config.db);

db.run('CREATE TABLE IF NOT EXISTS Referrer (' +
       'id INTEGER PRIMARY KEY NOT NULL,' +
       'whenText TEXT NOT NULL,' +
       'who TEXT NOT NULL,' +
       'url TEXT NOT NULL);');


var cookie_name = "srs";
var github_states = cache.create(config.gh_state_timeout);
var login_sessions = cache.create(config.session_timeout);

function createGitHubState(value){
    var key = crypto.randomBytes(32).toString('hex');
    while (github_states.get(key)){
        key = crypto.randomBytes(32).toString('hex');
    }
    github_states.put(key, value);
    return key;
}

function getRedirectUrl(cb){
    db.get('SELECT url FROM Referrer ORDER BY id DESC LIMIT 1;', (err, row) => {
        if (err) {
            return cb(err, null);
        }
        if (row) {
            return cb(null, row.url);
        } else {
            return cb(null, null);
        }
    });
}

app.get('/', function(req, res){
    getRedirectUrl((err, url) => {
        if (err) {
            return res.end(err);
        }
        if (url){
            res.render('index', {
                redirect_url: config.redirect_path,
                target_url: url,
                html_code: "<a href='" + config.host_prefix + config.redirect_path + "' rel='nofollow'></a>"
            });
        } else {
            res.render('no-redirect');
        }
    });
});

app.get(config.redirect_path, function(req, res){
    getRedirectUrl(function(err, url){
        if (! url){
            res.render('no-redirect');
        } else {
            res.redirect(url);
        }
    });
});

function get_user(token, cb){
    https.get({
        host: "api.github.com",
        path: '/user',
        headers: {
            'Authorization': 'token ' + token,
            'User-Agent': 'https://github.com/itsuart/simple-redirection-service'
        }
    }, function(gh_res){
        var data = "";
        gh_res.on('data', function(chunk){data += chunk;});
        gh_res.on('end', function(){
            if (gh_res.statusCode === 200) return cb(JSON.parse(data).login);
            console.log('Error while retrieving GitHub user login: %s %s', gh_res.statusCode, data);
            cb(null);
        });
    });
}

function can_write(user, repo, token, cb){
    https.get({
        host: "api.github.com",
        path: '/repos/' + repo + '/collaborators/' + user,
        headers: {
            'Authorization': 'token ' + token,
            'User-Agent': 'https://github.com/itsuart/simple-redirection-service'
        }
    }, function (gh_res){
        cb(gh_res.statusCode === 204);
    });
}

app.get(config.gh_auth_callback, function(req, res){
    if (! req.query.code){
        return res.send('no code.');
    }
    var state_key = req.query.state;
    if (! state_key){
        return res.send('no state.');
    }

    var stored_state = github_states.get(state_key);
    if (! stored_state){
        return res.send('state timeout.');
    }

    var token_request = querystring.stringify({
        client_id: config.gh_client_id,
        client_secret: config.gh_client_secret,
        code: req.query.code
    });
    
   https.request({
       host:"github.com",
       path:"/login/oauth/access_token",
       method: "POST",
       headers: {
           'Accept': 'application/json',
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': Buffer.byteLength(token_request)
       }
   }, function(github_res){
       if (github_res.statusCode !== 200){
           return res.end('GH status code = ' + github_res.statusCode);
       }
       var data = '';
       github_res.on('data', function(chunk){data += chunk;});
       github_res.on('end', function(){
           var result = JSON.parse(data);
           var access_token = result.access_token;
           if (! access_token){
               return res.end('no access token.');
           }
           var ret_address = github_states.get(state_key);
           github_states.remove(state_key);

           login_sessions.put(state_key, access_token);

           res.cookie(cookie_name, state_key);
           res.redirect(ret_address);
       });
   }).end(token_request);
});

app.get('/-/login', function(req, res){
    res.redirect(url.format({
        protocol: "https",
        host: 'github.com',
        pathname: '/login/oauth/authorize',
        query: {
            client_id: config.gh_client_id,
            state:  createGitHubState(req.query.ret || '/'),
            scope: config.gh_scope
        }
    }));
});


function setRedirectUrl(url, who, cb){
    db.run('INSERT INTO Referrer (whenText, who, url) VALUES (?, ?, ?);',
           new Date().toUTCString(), who, url, cb)
}

function withUser(req, res, cb){
    var key = req.cookies[cookie_name];
    if (! key){
        return res.redirect('/-/login?ret=' + req.path);
    }
    var token = login_sessions.get(key);
    if (! token){
        return res.redirect('/-/login?ret=' + req.path);
    }
    
    get_user(token, function(user){
        if (user){
            can_write(user, config.repo, token, function(yes){
                if (! yes){
                    //clear the cookie and token
                    res.clearCookie(cookie_name);
                    login_sessions.remove(key);
                    res.redirect('/login?ret=' + req.path);
                } else {
                    cb(user);
                }
            });
        }
    });
}

app.get('/-/set-redirect', function(req, res){
    withUser(req, res, user => {res.render('set-redirect');});
});


var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening on http://%s:%s', host, port);
});
