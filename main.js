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

function dbRedirectToUIModel(x){
    var full_route = config.host_prefix + x.route;
    return {
        route: x.route,
        full_route: full_route,
        html: `<a href=' ${full_route}' rel='noreferrer'></a>`,
        target: x.url
    };
}

app.get('/', (req, res) => {
    db.getActiveRedirects((err, redirects) => {
        if (err){
            console.log(err);
            return res.status(500).send(err.message);
        }
        var models = redirects.map(dbRedirectToUIModel);
        res.render('index', {active_redirects: models});
    });
});


app.get(config.gh_auth_callback, auth.handle_github_redirect);

app.get('/-/login', auth.begin_github_auth_sequence);

app.get('/-/redirects', auth.with_user, (req, res) => {
    var encoding = req.accepts('text/html', 'application/json');
    switch (encoding){
        case 'text/html':{
            return res.render('redirects');
        } break;
        case 'application/json':{
            db.getAllRedirects((err, redirects) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err.message);
                }
                return res.send({
                    'redirects': redirects.map(x => {
                        var result = dbRedirectToUIModel(x);
                        result.id = x.id;
                        return result;
                    })
                });
            });
        } break;
        default:{
            return res.status(406).send(`Unsupported content encoding ${encoding}`);
        } break;
    }
});

function validateRedirect (req, res, next){
    var inputUrl = req.body.target;
    var parsedUrl = url.parse(inputUrl);

    var inputRoute = req.body.route;

    if (! (parsedUrl.protocol && parsedUrl.host)){
        return res.status(400).render('new-redirect', {
            error: "Please provide proper and fully qualified url.",
            url: inputUrl,
            route: inputRoute
        });
    }

    if (! inputRoute ){
        return res.status(400).render('new-redirect', {
            error: 'Please provide a route for the redirect.',
            url: inputUrl,
            route: inputRoute
        });
    }

    if (inputRoute.startsWith('-/') || inputRoute.startsWith('/-/')){
        return res.status(400).render('new-redirect', {
            error: "Routes starting with -/ are reserved.",
            url: inputUrl,
            route: inputRoute
        });
    }
    
    var parsedRoute = url.parse(inputRoute);
    if (parsedRoute.protocol ||
        parsedRoute.host ||
        parsedRoute.auth ||
        parsedRoute.hostname ||
        parsedRoute.port ||
        parsedRoute.search ||
        parsedRoute.hash){
        return res.status(400).render('new-redirect', {
            error: 'Only plain path (e.g. /redirect) are valid routes.',
            url: inputUrl,
            route: inputRoute
        });
    }

    next();
}

app.put('/-/redirects', auth.with_user, validateRedirect, (req, res) => {
    var redirectId = req.body.id;
    if (! redirectId){
        return res.status(400).send('Redirect id is not set');
    }
});

app.post('/-/redirects', auth.with_user, validateRedirect, (req, res) => {
    var route = req.body.route;
    var target = req.body.target;

    db.setRedirectUrl(route, target, req.gh_user.user, err => {
        if (err) {
            console.log(err);
            return res.status(500).send(err.message);
        }
     
        var encoding = req.accepts('text/html', 'application/json');
        switch (encoding){
            case 'text/html':{
                return res.redirect('/-/redirects');
            } break;
            case 'application/json':{
                db.getAllRedirects((err, redirects) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err.message);
                    }
                    return res.send({
                        'redirects': redirects.map(x => {
                            var result = dbRedirectToUIModel(x);
                            result.id = x.id;
                            return result;
                        })
                    });
                });
            } break;
            default:{
                return res.status(406).send(`Unsupported content encoding ${encoding}`);
            } break;
        }
    });
});

app.get('/*', (req, res) => {
    db.getRedirectUrl(req.originalUrl, (err, url) =>{
        if (err){
            console.log(err);
            return res.status(500).send(err.message);
        }
        if (url){
            return res.redirect(url);
        }
        res.status(404).render('no-redirect');
    });
});

var server = app.listen(3000, function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening on http://%s:%s', host, port);
});
