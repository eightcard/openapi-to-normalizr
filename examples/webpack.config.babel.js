import 'babel-polyfill';

export default {
  output: {
    publicPath: '/',
    sourcePrefix: '  ',
    path: __dirname,
    filename: '[name].js',
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    modules: ['node_modules'],
  },

  entry: {
    'bundle': `${__dirname}/src/index.js`,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
};
