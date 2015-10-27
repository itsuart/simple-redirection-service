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
    getInitialState: function (){
        return {
            can_create: false,
            route_error: 'Please set a value',
            target_error: 'Please set a value',
            route: '',
            target: '',
            enabled: false
        };
    },
    getDefaultProps: function(){
        return {
            route: '',
            url: '',
            enabled: false,
        };
    },
    handleRouteChange: function(e){
        var value = e.target.value;
        var error = value ? '' : 'Please set a value';
        this.setState({
            can_create: !(this.state.target_error || error),
            route_error: error,
            route: value
        });
    },
    handleTargetChange: function(e){
        var value = e.target.value;
        var error = value ? '' : 'Please set a value';
        this.setState({
            can_create: !(this.state.route_error || error),
            target_error: error,
            target: value
        });
    },
    handleEnabledChange: function(e){
        this.setState({
            enabled: !!e.target.checked
        });
    },
    render: function(){
        var routeError;
        if (this.state.route_error){
            routeError = <span className='error-description'>{this.state.route_error}</span>;
        }
        
        var targetError;
        if (this.state.target_error){
            targetError = <span className='error-description'>{this.state.target_error}</span>;
        }
        return (
            <div class='new-redirect-entry'>
                <input className='route-input' type='text' value={this.state.route} placeholder='/some-route' onChange={this.handleRouteChange}/> {routeError} <br/>
                <input className='target-input' type='url' value={this.state.target} placeholder='http(s)://somehost' onChange={this.handleTargetChange}/> {targetError} <br/>
                <label><input className='toggle' type='checkbox' checked={!!this.state.enabled} onChange={this.handleEnabledChange}/> &nbsp;Enabled</label>
                <button className='submit-new-route' disabled={!this.state.can_create}>Create</button>
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
