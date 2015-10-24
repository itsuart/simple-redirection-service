'use strict';
var url = require('url');
var crypto = require('crypto');
var querystring = require('querystring');
var https = require('https');

var config = require('./config');
var cache = require('./cache');

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

module.exports.handle_github_redirect = function (req, res){
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
};

module.exports.begin_github_auth_sequence = function (req, res){
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
};

module.exports.with_user = function(req, res, next){
    var key = req.cookies[cookie_name];
    if (! key){
        return res.redirect('/-/login?ret=' + req.path);
    }
    var authObj = login_sessions.get(key);
    if (! authObj){
        return res.redirect('/-/login?ret=' + req.path);
    }
    req.gh_user = authObj;
    next();

};
