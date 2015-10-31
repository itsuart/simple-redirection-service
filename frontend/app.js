'use strict';
var React = require('react');
var ReactDOM = require('react-dom');
var NewEntry = require('./NewEntry');
var RedirectsList = require('./RedirectsList.js');

var App = React.createClass({
    getInitialState: function (){
        return {
            redirects : []
        };
    },

    createNew: function (redirect){
        this.setState({
            redirects: this.state.redirects.concat([redirect])
        });
    },
    
    render: function (){
        return (
            <div>
                <NewEntry addNew={this.createNew}/>
                <div className='separator'/>
                <RedirectsList items={this.state.redirects} />
            </div>
        );
    }
});

ReactDOM.render(<App />, document.getElementById('app-root'));
