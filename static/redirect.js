"use strict";

var RedirectEntry = React.createClass({
    displayName: "RedirectEntry",

    render: function render() {
        return React.createElement(
            "div",
            { className: "redirect-entry" },
            React.createElement(
                "div",
                { className: "redirect-route" },
                "Route: ",
                React.createElement(
                    "a",
                    { href: "{this.props.route}" },
                    this.props.route
                )
            ),
            React.createElement(
                "div",
                { className: "redirect-html" },
                "Html: ",
                this.props.html
            ),
            React.createElement(
                "div",
                { className: "redirect-target" },
                "Target: ",
                React.createElement(
                    "a",
                    { href: "{this.props.target}" },
                    this.props.target
                )
            )
        );
    }
});

var NewRedirectEntry = React.createClass({
    displayName: "NewRedirectEntry",

    getInitialState: function getInitialState() {
        return {
            can_create: false,
            route_error: 'Please set a value',
            target_error: 'Please set a value',
            route: '',
            target: '',
            enabled: false
        };
    },
    getDefaultProps: function getDefaultProps() {
        return {
            route: '',
            url: '',
            enabled: false,
            addNew: function addNew() {}
        };
    },
    handleRouteChange: function handleRouteChange(e) {
        var value = e.target.value;
        var error = value ? '' : 'Please set a value';
        this.setState({
            can_create: !(this.state.target_error || error),
            route_error: error,
            route: value
        });
    },
    handleTargetChange: function handleTargetChange(e) {
        var value = e.target.value;
        var error = value ? '' : 'Please set a value';
        this.setState({
            can_create: !(this.state.route_error || error),
            target_error: error,
            target: value
        });
    },
    handleEnabledChange: function handleEnabledChange(e) {
        this.setState({
            enabled: !!e.target.checked
        });
    },
    handleCreateClick: function handleCreateClick() {
        var redirect = {
            route: this.state.route,
            target: this.state.target,
            enabled: this.state.enabled
        };
        this.props.addNew(redirect);
    },
    render: function render() {
        var routeError;
        if (this.state.route_error) {
            routeError = React.createElement(
                "span",
                { className: "error-description" },
                this.state.route_error
            );
        }

        var targetError;
        if (this.state.target_error) {
            targetError = React.createElement(
                "span",
                { className: "error-description" },
                this.state.target_error
            );
        }
        return React.createElement(
            "div",
            { "class": "new-redirect-entry" },
            React.createElement("input", { className: "route-input", type: "text", value: this.state.route, placeholder: "/some-route", onChange: this.handleRouteChange }),
            " ",
            routeError,
            " ",
            React.createElement("br", null),
            React.createElement("input", { className: "target-input", type: "url", value: this.state.target, placeholder: "http(s)://somehost", onChange: this.handleTargetChange }),
            " ",
            targetError,
            " ",
            React.createElement("br", null),
            React.createElement(
                "label",
                null,
                React.createElement("input", { className: "toggle", type: "checkbox", checked: !!this.state.enabled, onChange: this.handleEnabledChange }),
                "  Enabled"
            ),
            React.createElement(
                "button",
                { className: "submit-new-route", disabled: !this.state.can_create, onClick: this.handleCreateClick },
                "Create"
            )
        );
    }
});

var RedirectsList = React.createClass({
    displayName: "RedirectsList",

    getDefaultProps: function getDefaultProps() {
        return { items: [] };
    },
    render: function render() {
        var items = this.props.items.map(function (x) {
            return React.createElement(RedirectEntry, { route: x.route, target: x.target, html: x.html });
        });
        return React.createElement(
            "div",
            { className: "redirects-list-container" },
            items
        );
    }
});

var App = React.createClass({
    displayName: "App",

    getInitialState: function getInitialState() {
        return {
            redirects: []
        };
    },

    createNew: function createNew(redirect) {
        this.setState({
            redirects: this.state.redirects.concat([redirect])
        });
    },

    render: function render() {
        return React.createElement(
            "div",
            null,
            React.createElement(NewRedirectEntry, { addNew: this.createNew }),
            React.createElement("div", { className: "separator" }),
            React.createElement(RedirectsList, { items: this.state.redirects })
        );
    }
});

ReactDOM.render(React.createElement(App, null), document.getElementById('app-root'));
