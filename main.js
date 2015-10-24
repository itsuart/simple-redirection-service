'use strict';


var url = require('url');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var path = require('path');
var url = require('url');

var config = require('./config');
var db = require('./db')(config.db);
var auth = require('./auth');
var app = express();

app.use(require('cookie-parser')());
app.use(express.static('static'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });
app.set('view engine', 'ect');
app.engine('ect', ectRenderer.render);

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

app.get(config.gh_auth_callback, auth.handle_github_redirect);

app.get('/-/login', auth.begin_github_auth_sequence);

app.get('/-/set-redirect', auth.with_user, function(req, res){
    db.getLast10Redirects( (err, redirects) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err.message);
        }
            
        res.render('set-redirect', {last10: redirects});
    });
});

app.post('/-/set-redirect', auth.with_user, (req, res) => {
    var inputUrl = req.body.url;
    var parsedUrl = url.parse(inputUrl);
    if (! (parsedUrl.protocol && parsedUrl.host)){
        return res.status(400).render('set-redirect', {
            error: "Please provide proper and fully qualified url.",
            url: inputUrl,
        });
    }
    db.setRedirectUrl(inputUrl, req.gh_user, err => {
        if (err) {
            return res.setStatus(500).send(err.message);
        }
        return res.redirect('/');
    });
});

var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening on http://%s:%s', host, port);
});
