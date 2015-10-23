'use strict';

var crypto = require('crypto');
var url = require('url');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var path = require('path');
var url = require('url');

var cache = require('./cache');
var config = require('./config');
var db = require('./db')(config.db);
var app = express();

app.use(require('cookie-parser')());
app.use(express.static('static'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });
app.set('view engine', 'ect');
app.engine('ect', ectRenderer.render);

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
    db.getRedirectUrl((err, url) => {
        if (err) {
            return res.end(err);
        }
        if (url){
            res.render('index', {
                redirect_url: config.redirect_path,
                target_url: url,
                html_code: "<a href='" + config.host_prefix + config.redirect_path + "' rel='noreferrer'></a>"
            });
        } else {
            res.render('no-redirect');
        }
    });
});

app.get(config.redirect_path, function(req, res){
    db.getRedirectUrl(function(err, url){
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

           get_user(access_token, function(user){
               if (user){
                   can_write(user, config.repo, access_token, function(yes){
                       if (! yes){
                           res.redirect('/-/login?ret=' + req.path);
                       } else {
                           login_sessions.put(state_key, {token: access_token, user: user});
                           res.cookie(cookie_name, state_key);
                           res.redirect(ret_address);
                       }
                   });
               }
           });
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

function withUser(req, res, cb){
    var key = req.cookies[cookie_name];
    if (! key){
        return res.redirect('/-/login?ret=' + req.path);
    }
    var authObj = login_sessions.get(key);
    if (! authObj){
        return res.redirect('/-/login?ret=' + req.path);
    }
    
    cb(authObj.user);
}


app.get('/-/set-redirect', function(req, res){
    withUser(req, res, user => {
        db.getLast10Redirects( (err, redirects) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }
            
            res.render('set-redirect', {last10: redirects});
        });
    });
});

app.post('/-/set-redirect', (req, res) => {
    withUser(req, res, user => {
        var inputUrl = req.body.url;
        var parsedUrl = url.parse(inputUrl);
        if (! (parsedUrl.protocol && parsedUrl.host)){
            return res.status(400).render('set-redirect', {
                error: "Please provide proper and fully qualified url.",
                url: inputUrl,
            });
        }
        db.setRedirectUrl(inputUrl, user, err => {
            if (err) {
                return res.setStatus(500).send(err.message);
            }
            return res.redirect('/');
        });
    });
});

var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening on http://%s:%s', host, port);
});
