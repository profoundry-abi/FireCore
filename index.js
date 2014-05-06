console.log(' *** index.js');

var dirname = __dirname; // dirname of this file

var path = require('path');
var env = require('sproutnode');

var files = [
  'core.js',
  'data_source.js'
];

files.forEach(function (f) {
  console.log(' *** loading: ', f, path.join(dirname, f));
  env.loadFile(path.join(dirname, f));
});

module.exports.__env = env;

console.log(' *** FireCore var: ', FireCore);
