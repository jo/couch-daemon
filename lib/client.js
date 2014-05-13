/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * client - Assists in creating a command line client.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var dbs = require('./dbs');
var ddocs = require('./ddocs');
var changes = require('./changes');
var compile = require('./compile');
var checkpoint = require('./checkpoint');
var logger = require('./logger');

var url = require('url');
var _ = require('highland');
var minimist = require('minimist');

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

  if (options.whitelist) {
    options.whitelist = options.whitelist.split(/,\s*/);
  }
  if (options.blacklist) {
    options.blacklist = options.blacklist.split(/,\s*/);
  }


  var couch = url.format({
    protocol: 'http',
    hostname: options.address || 'localhost',
    port: options.port || 5984,
    auth: options.auth && options.auth.username && options.auth.password ? [ options.auth.username, options.auth.password ].join(':') : null
  });


  return function(worker) {
    _.pipeline(
      dbs(couch, options),
      ddocs(couch, options),
      changes(couch, options),
      compile(couch, options),

      worker,

      checkpoint(couch, options),
      logger(options)
    );
  }; 
};
