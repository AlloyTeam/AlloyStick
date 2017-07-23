/**
 * Created by iconie on 22/07/2017.
 */
const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

//由于资源不多,使用happyPack并不能加速反而因为额外的开销减速,所以移除

module.exports = {

    entry:{
        AlloyStick: './src/new/AlloyStick.js'
    },

    output:{
        path: path.join(__dirname, 'dist'),
        filename: '[name].min.js'
    },

    plugins: [
        new UglifyJSPlugin(),
    ],

    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader?presets[]=es2015',
            }
        ]
    },
};
