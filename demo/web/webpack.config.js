const path = require('path');
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'ireal2musicxml-demo.js'
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    compress: true,
    port: 9000,
    watchContentBase: true
  },
  plugins: [new CompressionPlugin()],
  module: {
    rules: [
      {
        test: /\.txt$/i,
        use: [{
          loader: 'raw-loader',
          options: {
            esModule: false,
          }
        }]
      }
    ],
  }
};
