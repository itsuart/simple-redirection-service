'use strict';
var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: __dirname + "/frontend",
    entry: "./app.js",
    output: {
        path: __dirname + "/static",
        filename: "app.js"
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['babel'],
            include: path.join(__dirname, 'frontend')
        }]
    },
    resolve: {
        modulesDirectories: [ 'app', 'app/styles/components', 'node_modules' ],
        extensions: ['', '.js', '.jsx'],
    },
    plugins: [
      new webpack.NoErrorsPlugin()
    ]
};
