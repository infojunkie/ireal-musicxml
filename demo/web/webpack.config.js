const path = require('path');
const CompressionPlugin = require("compression-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

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
    watchContentBase: true,
    proxy: {
      '/convert': {
        target: {
          host: "0.0.0.0",
          protocol: 'http:',
          port: 3000
        },
      }
    }
  },
  plugins: [new CompressionPlugin(), new NodePolyfillPlugin()],
  resolve: {
    fallback: {
      'fs': false
    }
  },
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
