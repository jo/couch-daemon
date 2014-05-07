#!/usr/bin/env node
/* example daemon
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var stream = require('../lib/stream');
var logger = require('../lib/logger');

var _ = require('highland');
var minimist = require('minimist');
var url = require('url');
var nano = require('nano');

var options = minimist(process.argv.slice(2), {
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



// kick things of
_.pipeline(
  stream(couch, options),

  _.filter(function(d) {
    return d.dbname && d.id;
  }),

  _.map(function(d) {
    return {
      type: 'log',
      message: 'processing: ' + d.dbname + '/' + d.id
    };
  }),

  logger(options)
);
