var React = require('react');

var RedirectEntry = React.createClass({
    render: function(){
        return (
            <div className="redirect-entry">
                <div className="redirect-route">
                Route: <a href='{this.props.route}'>{this.props.route}</a>
                </div>
                <div className="redirect-html">
                Html: {this.props.html}
                </div>
                <div className='redirect-target'>
                Target: <a href='{this.props.target}'>{this.props.target}</a>
                </div>
            </div>
        );
    }
});

module.exports = RedirectEntry;
