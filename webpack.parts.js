exports.devServer = ({ host, port } = {}) => ({
  devServer: {
    stats: "errors-only",
    host,  // Defaults to `localhost`
    port, // Defaults to 8080
    overlay: {
      errors: true,
      warnings: true,
    },
  },
});

exports.loadJavaScript = ({ include, exclude } = {}) => ({
	module: {
	  rules: [
		{
		  test: /\.js$/,
		  include,
		  exclude,
		  use: "babel-loader",
		},
	  ],
	},
  });

const ExtractTextPlugin = require("extract-text-webpack-plugin");

exports.extractCSS = ({ include, exclude }) => {
  // Output extracted CSS to a file
  const plugin = new ExtractTextPlugin({
    // `allChunks` is needed with CommonsChunkPlugin to extract
    // from extracted chunks as well.
    allChunks: true,
    filename: "[name].css",
  });

  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          include,
          exclude,

          use: plugin.extract([ 'css-loader', 'sass-loader' ]),
        },
      ],
    },
    plugins: [plugin],
  };
};


exports.loadImages = ({ include, exclude, options } = {}) => ({
	module: {
	  rules: [
		{
		  test: /\.(png|jpg|svg)$/,
		  include,
		  exclude,
		  use: {
			loader: "url-loader",
			options: {
				limit: 1500000,
				name: "[path][name].[ext]",
			  }
		  },
		}
	  ],
	},
  });



  exports.loadFonts = ({ include, exclude } = {}) => ({
	module: {
	  rules: [
		{
			test: /\.(ttf|eot|woff|woff2)$/,
			loader: "file-loader",
			options: {
			  name: "fonts/[name].[ext]",
			},
		  },
	  ],
	},
  });

  exports.loadJquery = ({ include, exclude } = {}) => ({
	module: {
		plugins: [
			new webpack.ProvidePlugin({
			   $: "jquery",
			   jQuery: "jquery"
		   })
		]
	},
  });

