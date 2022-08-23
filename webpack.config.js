const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); 
const TerserPlugin = require("terser-webpack-plugin");


module.exports = {
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
        extractComments: true, 
        parallel: true,           
        extractComments: "all",
        terserOptions: {
          compress: {
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'] 
          }
        }
		  }
    )],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "mqwidgets2.min.css",
    })
  ],
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
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ]
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'mqwidgets2.js',
    path: path.resolve(__dirname, 'dist'),
  },
};