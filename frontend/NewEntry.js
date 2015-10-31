'use strict';

var React = require('react');

module.exports = React.createClass({
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
