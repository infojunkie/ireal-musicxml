const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: 'ireal-musicxml.js',
    library: 'iReal2MusicXML',
    libraryTarget: 'umd',
    globalObject: 'this', // https://stackoverflow.com/a/64639975/209184
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components|lib)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new ESLintPlugin()
  ],
};
