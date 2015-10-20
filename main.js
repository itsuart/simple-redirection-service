'use strict';

var crypto = require('crypto');
var url = require('url');
var https = require('https');
var express = require('express');
var querystring = require('querystring');
var sqlite = require('sqlite3').verbose();
var path = require('path');

var cache = require('./cache');
var config = require('./config');

var app = express();
app.use(require('cookie-parser')());
app.use(express.static('static'));
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


app.get('/', function(req, res){
    res.render('index', {url: 'http://hello.world'});
});

app.get(config.redirect_path, function(req, res){
    db.get('SELECT url FROM Referrer ORDER BY id DESC LIMIT 1;', function(err, row){
        if (! row){
            res.end('nowhere to redirect to');
        } else {
            res.redirect(row.url);
        }
    });
});

app.get('/jump', function(req, res){

});

app.get('/login', function(req, res){
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



app.get('/test', function(req, res){
    var key = req.cookies[cookie_name];
    if (! key){
        return res.redirect('/login?ret=/test');
    }
    var token = login_sessions.get(key);
    if (! token){
        return res.redirect('/login?ret=/test');
    }
    
    get_user(token, function(user){
        if (user){
            can_write(user, config.repo, token, function(yes){
                if (! yes){
                    //clear the cookie and token
                    res.clearCookie(cookie_name);
                    login_sessions.remove(key);
                    res.redirect('/login?ret=/test');
                } else {
                    res.end('yes, you can!');
                }
            });
        }
    });
});


var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening on http://%s:%s', host, port);
});
