const webpack = require('webpack');
const path = require('path');
const BundleAsAFunction = require('./bundle-as-function-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

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
    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.optimize.UglifyJsPlugin(),
        new BundleAsAFunction({
            files: {
                'main.build.js': '../production-extension/main.fn.build.js'
            }
        }),
        new webpack.BannerPlugin({
            banner: `
Copyright (C) 2017 Mike Talbot (Ixion Digital)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
`
        })

    ],
    devtool: 'none',
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader',
            query: {
                cacheDirectory: false,
                presets: ['es2015', 'es2017']
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

