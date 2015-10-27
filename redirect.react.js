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

var NewRedirectEntry = React.createClass({
    getDefaultProps: function(){
        return {
            route: '',
            url: '',
            enabled: false,
        };
    },
    render: function(){
        return (
            <div class='new-redirect-entry'>
                <input className='route-input' type='text' value={this.props.route} placeholder='/some-route'/> <br/>
                <input className='target-input' type='url' value={this.props.target} placeholder='http(s)://somehost' /> <br/>
                <label><input className='toggle' type='checkbox'checked={!!this.props.enabled}/> &nbsp;Enabled</label>
                <button className='submit-new-route'>Create</button>
            </div>
        );
    }
});

var App = React.createClass({
    render: function (){
        return(
            <div>
                <NewRedirectEntry />
                <div className='separator'/>
                <RedirectEntry route='/something' target='https://google.com' html="&lt;a href='http://localhost:3000/something' rel='noreferrer'&gt;something&lt;/a&gt;" />
            </div>
        );
    }
});

ReactDOM.render(<App />, document.getElementById('app-root'));
