'use strict';

var React = require('react');

module.exports = React.createClass({
    getInitialState: function (){
        return {
            first_run: true,

            route: this.props.route,
            route_error: this._getRouteError(this.props.route),

            target: this.props.target,
            target_error: this._getTargetError(this.props.target),

            enabled: this.props.enabled,
        };
    },
    getDefaultProps: function(){
        return {
            route: '',
            target: '',
            enabled: false,
            addNew: function(){},
            locked: false
        };
    },
    _getRouteError(value){
        if (! value) {
            return 'Please set a value';
        }
        if (! value.startsWith('/')) {
            return "Route must start with '/'";
        }
        return "";
    },
    handleRouteChange: function(e){
        var value = e.target.value;
        var error = this._getRouteError(value);
        this.setState({
            route_error: error,
            route: value,
            first_run: false
        });
    },
    _getTargetError(value){
        if (! value) {
            return 'Please set a value';
        }

        if (value.startsWith('http://')){
            if (value.length <= 'http://'.length){
                return "Please provide domain/IP address";
            }
        } else if (value.startsWith('https://')){
            if (value.length <= 'http://'.length){
                return "Please provide domain/IP address";
            }
        } else {
            return "Target must start with 'http://' or 'https://'";
        }
        return "";
    },
    handleTargetChange: function(e){
        var value = e.target.value;
        var error = this._getTargetError(value);
        this.setState({
            target_error: error,
            target: value,
            first_run: false
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
        var targetError;
        if (! this.state.first_run){
            if (this.state.route_error){
                routeError = <span className='error-description'>{this.state.route_error}</span>;
            }

            if (this.state.target_error){
                targetError = <span className='error-description'>{this.state.target_error}</span>;
            }
        }

        var creation_disabled = !!(this.state.first_run || this.state.route_error || this.state.target_error);

        return (
            <div class='new-redirect-entry'>
                <input disabled={this.props.locked} className='route-input' type='text' value={this.state.route} placeholder='/some-route' onChange={this.handleRouteChange}/> {routeError} <br/>
                <input disabled={this.props.locked} className='target-input' type='url' value={this.state.target} placeholder='http(s)://somehost' onChange={this.handleTargetChange}/> {targetError} <br/>
                <label><input disabled={this.props.locked} className='toggle' type='checkbox' checked={!!this.state.enabled} onChange={this.handleEnabledChange}/> &nbsp;Enabled</label>
                <button className='submit-new-route' disabled={this.props.locked || creation_disabled} onClick={this.handleCreateClick}>Create</button>
            </div>
        );
    }
});
