# simple-redirection-service
Simple redirecting web service with Github login

## example config.js content
var path = require('path');
module.exports = {
    gh_client_id: "<GitHub Application Client Id>",
    gh_client_secret: "<GitHub Application Client Secret>",
    gh_auth_callback: "/-/gh-auth", //must be the same as set in your GitHub Application
    gh_scope: 'user, public_repo', //https://developer.github.com/v3/oauth/#scopes

    repo: "itsuart/simple-redirection-service", //format: owner/repo
    db: path.join(__dirname, "db/db.db3"), //where SQLite db should reside
    host_prefix: "http://localhost:3000", //change to your domain
    gh_state_timeout: 5 * 60 * 1000, //5 minutes timeout to log-in into GitHub.
    session_timeout: 24 * 60 * 60 * 1000, //1 day timeout for sessions
};
