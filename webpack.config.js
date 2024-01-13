const path = require('path');

module.exports = {
  entry: path.resolve(path.resolve(__dirname, 'intermediate'), 'index.js'),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
    fallback: { fs: false }
  },
  output: {
    filename: 'plasticslang.js',
    path: path.resolve(path.resolve(__dirname, 'intermediate'), 'static'),
    library: 'PlasticsLang',
    libraryTarget: 'var'
  }
};