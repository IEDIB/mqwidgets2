const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); 
const TerserPlugin = require("terser-webpack-plugin");
const InjectPlugin = require('webpack-inject-plugin');
const fs = require('fs')

// Inject code to the beginning of the bundle
const loader = function() {
  //Inject css
  let css = fs.readFileSync('./src/styles/index.css', {encoding: 'utf-8'})
  css = css.replace(/\n/g,' ').replace(/\'/g,"\\'") //.replace(/\/\*(.*?)\*\//g,'')
  css = `var style = document.createElement('style'); 
style.innerHTML = '${css}';
style.id = 'mqwidgets_css';
document.getElementsByTagName('head')[0].appendChild(style);`
  //Inject Mathquill
  return css+'\n'+fs.readFileSync('./dist/lib/mathquill.matrix.min.js', {encoding: 'utf-8'})
} 

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
    new InjectPlugin.default(loader, { 
      entryOrder: InjectPlugin.ENTRY_ORDER.First  //Make the injected code be the first entry point 
    }),

    new MiniCssExtractPlugin({
      filename: "mqwidgets2.min.css",
    })
  ],
  entry:  './src/index.ts',
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
  externals: {
    jquery: 'jQuery',
    MathJax: 'MathJax'
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'mqwidgets2.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'MQWidgets',
    libraryTarget: 'global',
    umdNamedDefine: true 
  },
};