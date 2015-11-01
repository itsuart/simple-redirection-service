'use strict';
var React = require('react');
var ReactDOM = require('react-dom');
var NewEntry = require('./NewEntry');
var RedirectsList = require('./RedirectsList.js');

var store = {};

function getRedirects(cb){
    var request = new XMLHttpRequest();
    request.open('GET', '/-/redirects', true);
    request.setRequestHeader('Accept', 'application/json');

    request.onload = () => {
        var resp = request.responseText;
        console.log(resp);
        if (request.status >= 200 && request.status < 400) {
            cb (null, JSON.parse(resp));
        } else {
            cb(resp, null);
        }
    };

    request.onerror = () => {
        cb('connectivity failure', false);
    };

    request.send();
}

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

function addRedirect(redirect, cb){
    var request = new XMLHttpRequest();
    request.open('POST', '/-/redirects', true);
    request.setRequestHeader('Accept', 'application/json');
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.onload = () => {
        var resp = request.responseText;
        console.log(resp);
        if (request.status >= 200 && request.status < 400) {
            cb (null, JSON.parse(resp));
        } else {
            cb(resp, null);
        }
    };

    request.onerror = () => {
        cb('connectivity failure', false);
    };
    
    request.send(serialize(redirect));
}

var App = React.createClass({
    getInitialState: function (){
        return {
            redirects : [],
            locked: false
        };
    },

    componentDidMount(){
        getRedirects((err, data) =>{
            if (err){
                return console.log(err);
            }
            this.setState({
                redirects: data.redirects
            });
        });
    },

    _createNew(redirect){
        this.setState({
            locked: true
        });
        addRedirect(redirect, (err, data) => {
            var new_state = {locked: false};
            if (err){
                console.log(err); // TODO: show user an error UI
            } else {
                new_state.redirects = data.redirects;
            }
            this.setState(new_state);
            this.setState(new_state);
        });
    },
    
    render: function (){
        return (
            <div>
                <NewEntry addNew={this._createNew} locked={this.state.locked}/>
                <div className='separator'/>
                <RedirectsList items={this.state.redirects}/>
            </div>
        );
    }
});

ReactDOM.render(<App />, document.getElementById('app-root'));
