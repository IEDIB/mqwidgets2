const path = require('path');

  module.exports = {
    entry: './src/index.ts',
   devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: [
            { // babel-loader runs second and receives output of ts-loader
                loader: 'babel-loader'
            },
            { // ts-loader runs first
                loader: 'ts-loader',
                options: {
                    // ts-loader options
                },
            }
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      filename: 'matheditor2.min.js',
      path: path.resolve(__dirname, 'dist'),
    },
  };