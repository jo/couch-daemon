/* couch-daemon
 * 
 * client - assists in creating a command line client
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var stream = require('./stream');
var checkpoint = require('./checkpoint');
var logger = require('./logger');

var minimist = require('minimist');
var url = require('url');
var nano = require('nano');


module.exports = function(argv) {
  var options = minimist(argv.slice(2), {
    booleans: ['version']
  });


  if (options.version) {
    var pkg = require('../package.json');
    console.log(pkg.name, pkg.version);
    process.exit(0);
  }


  if (options.username) {
    options.auth = {
      username: options.username,
      password: options.password
    };
    delete options.username;
    delete options.password;
  }
  delete options._;

  var couch = nano(url.format({
    protocol: 'http',
    hostname: options.address || 'localhost',
    port: options.port || 5984,
    auth: options.auth && options.auth.username && options.auth.password ? [ options.auth.username, options.auth.password ].join(':') : null
  }));


  return {
    couch: couch,
    options: options,
    stream: stream(couch, options),
    checkpoint: checkpoint(options),
    logger: logger(options)
  };
};
