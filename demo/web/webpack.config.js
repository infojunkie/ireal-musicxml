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
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    watchFiles: ['dist/**/*'],
    proxy: {
      '/mma': {
        target: 'http://localhost:3000',
        pathRewrite: { '/mma': '' }
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
        test: /\.txt|\.musicxml$/i,
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
