var CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackIncludeAssetsPlugin = require("html-webpack-include-assets-plugin");
const path = require("path");

const merge = require("webpack-merge");
const webpack = require('webpack'); //to access built-in plugins
const parts = require("./webpack.parts");

const PATHS = {
  app: path.join(__dirname, "app"),
  appIndex: path.join(__dirname, "app/index.js"),
  build: path.join(__dirname, "build"),
};

const commonConfig = merge([
  {
	context: path.join(__dirname, 'app'), 
    entry: {threeBundle:'./js/kye-three',pageFormat: PATHS.appIndex},
    output: {
      path: PATHS.build,
      filename: "[name].js",
    },
    plugins: [
		new CopyWebpackPlugin([
			{ from: 'js/three/js-libs/libs/stats.min.js', to: 'js/three/js-libs/libs'},
			{ from: 'js/three/js-libs/libs/dat.gui.min.js', to: 'js/three/js-libs/libs'},
			{ from: 'exports', to: 'exports'}, 
      { from: 'imgs', to: 'imgs'}, 
		]),
		new HtmlWebpackPlugin({title: "Webpack demo",template:  PATHS.app + '/openCollada-outliner.html',inject: true}),
		new HtmlWebpackIncludeAssetsPlugin({
			assets: [
				'js/three/js-libs/libs/stats.min.js',
				'js/three/js-libs/libs/dat.gui.min.js',

		],
			append: false,
		  }),
		new webpack.ProvidePlugin({$: "jquery",jQuery: "jquery"}) 
    ],
  },
  parts.extractCSS("",""),
  parts.loadImages("",""),
  parts.loadFonts("",""),
  parts.loadJavaScript({ include: PATHS.app }),
]);

const productionConfig = merge([]);

const developmentConfig = merge([
  parts.devServer({
    // Customize host/port here if needed
    host: process.env.HOST,
	port: process.env.PORT,
  }),
]);

module.exports = env => {
  if (env === "production") {
    return merge(commonConfig, productionConfig);
  }

  return merge(commonConfig, developmentConfig);
};