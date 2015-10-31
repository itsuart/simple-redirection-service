'use strict';

var React = require('react');
var RedirectEntry = require('./RedirectEntry');

var RedirectsList = React.createClass({
    getDefaultProps: function(){
        return {items: []};
    },
    render: function (){
        var items = this.props.items.map(x => <RedirectEntry route={x.route} target={x.target} html={x.html}/> );
        return (
          <div className='redirects-list-container'>
                {items}
          </div>
        );
    }
});

module.exports = RedirectsList;
