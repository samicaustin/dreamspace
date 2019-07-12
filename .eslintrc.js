module.exports = {
  'extends': 'airbnb',
  'env': {
    'node': true,
    'es6': true,
    'browser': true,
    'commonjs': true,
    'jquery': true
  },
  'plugins': [
    'html',
    'react',
    'jsx-a11y',
    'import'
  ],
  'parser': 'babel-eslint',
  'rules': {
    'indent': [2, 4],
    'linebreak-style': 0,
    'react/jsx-filename-extension': 0,
    'no-plusplus': 'off',
  },
};
