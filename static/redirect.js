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

    getDefaultProps: function getDefaultProps() {
        return {
            route: '',
            url: '',
            enabled: false
        };
    },
    render: function render() {
        return React.createElement(
            "div",
            { "class": "new-redirect-entry" },
            React.createElement("input", { className: "route-input", type: "text", value: this.props.route, placeholder: "/some-route" }),
            " ",
            React.createElement("br", null),
            React.createElement("input", { className: "target-input", type: "url", value: this.props.target, placeholder: "http(s)://somehost" }),
            " ",
            React.createElement("br", null),
            React.createElement(
                "label",
                null,
                React.createElement("input", { className: "toggle", type: "checkbox", checked: !!this.props.enabled }),
                "  Enabled"
            ),
            React.createElement(
                "button",
                { className: "submit-new-route" },
                "Create"
            )
        );
    }
});

var App = React.createClass({
    displayName: "App",

    render: function render() {
        return React.createElement(
            "div",
            null,
            React.createElement(NewRedirectEntry, null),
            React.createElement("div", { className: "separator" }),
            React.createElement(RedirectEntry, { route: "/something", target: "https://google.com", html: "<a href='http://localhost:3000/something' rel='noreferrer'>something</a>" })
        );
    }
});

ReactDOM.render(React.createElement(App, null), document.getElementById('app-root'));
