const path = require('path');
const webpack = require('webpack');
const GoogleFontsPlugin = require("@beyonk/google-fonts-webpack-plugin");

module.exports = {
    configureWebpack: {
        resolve: {
            alias: {
                vis: path.resolve(__dirname, '../common/3dparty/vis'),
                flot: path.resolve(__dirname, './src/3dparty/flot'),
            }
        },
        plugins: [
            new webpack.DefinePlugin({
                VERSION: JSON.stringify(
                    require('./package.json').version
                ),
                LAST_GIT_COMMIT: JSON.stringify(
                    require('child_process')
                        .execSync('git rev-list --format=format:\'%ai\' --max-count=1 `git rev-parse HEAD`')
                        .toString()
                        .trim()
                ),
            }),
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
            }),
            new GoogleFontsPlugin({
                fonts: [
                    { family: 'Roboto', variants: [ '400' ] }
                ],
            }),
        ]
    },
    devServer: {
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:4201'
            },
        },
    },
};
