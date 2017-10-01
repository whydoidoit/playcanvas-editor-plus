const webpack = require('webpack');
const path = require('path');
const BundleAsAFunction = require('./bundle-as-function-webpack-plugin')
console.log("This one")
module.exports = {
    entry: {
        main: './src/main.js',
        combine: './src/node_modules/mesh-combiner/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].build.js',
        publicPath: '/'
    },
    plugins: [new BundleAsAFunction({
        files: {
            'main.build.js': '../production-extension/main.fn.build.js'
        }
    })],
    devtool: '#inline-source-map',
    devServer: {
        contentBase: './build',
        hot: true,
        overlay: true,
        inline: true,
        open: false,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        }
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: [/node_modules/, "/node_modules"],
            loader: 'babel-loader',
            query: {
                presets: ['es2015', 'es2017'],
                plugins: [
                    'transform-runtime'
                ]
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
        }, {
            test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "file-loader"
        }, {
            test: /\.json$/,
            loader: "json"

        }
        ]
    }
};

