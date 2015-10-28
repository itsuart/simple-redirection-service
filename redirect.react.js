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
            addNew: function(){}
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
    handleCreateClick: function(){
        var redirect = {
            route: this.state.route,
            target: this.state.target,
            enabled: this.state.enabled
        };
        this.props.addNew(redirect);
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
                <button className='submit-new-route' disabled={!this.state.can_create} onClick={this.handleCreateClick}>Create</button>
            </div>
        );
    }
});

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
        return(
            <div>
                <NewRedirectEntry addNew={this.createNew}/>
                <div className='separator'/>
                <RedirectsList items={this.state.redirects} />
            </div>
        );
    }
});

ReactDOM.render(<App />, document.getElementById('app-root'));
