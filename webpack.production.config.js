const webpack = require('webpack');
const path = require('path');
const BundleAsAFunction = require('./bundle-as-function-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    entry: {
        main: './src/main.js'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].build.js',
        publicPath: '/'
    },
    plugins: [new UglifyJSPlugin({
        mangle: true,
        extractComments: true,
        compress: true
    }), new BundleAsAFunction({
        files: {
            'main.build.js': '../production-extension/main.fn.build.js'
        }
    })],
    devtool: 'none',
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: [/node_modules/, "/node_modules"],
            loader: 'babel-loader',
            query: {
                presets: ['ES2017']
            }
        }, {
            test: /\.scss$/,
            use: [{
                loader: "style-loader"
            }, {
                loader: "css-loader", options: {
                    sourceMap: true
                }
            }, {
                loader: "sass-loader", options: {
                    sourceMap: true
                }
            }]
        }, {
            test: /\.glsl$/,
            use: [{loader: 'raw-loader'}]
        }, {
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "url-loader?limit=100000000&mimetype=application/font-woff"
        },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            }]
    }
};

