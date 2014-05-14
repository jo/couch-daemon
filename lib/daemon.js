/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * daemon - The high level daemon.
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
var bridge = require('couch-daemon-bridge')


module.exports = function(worker) {
  function pipeline(options) {
    options = options || {};


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


    // fire the worker pipeline
    _.pipeline(
      dbs(couch, options),
      ddocs(couch, options),
      changes(couch, options),
      compile(options),

      worker,

      checkpoint(couch, options),
      logger(options)
    );
  }



  // running interactively
  if (process.stdin.isTTY) {
    var opts = minimist(process.argv.slice(2), {
      booleans: ['version']
    });
    return pipeline(opts);
  }


  // running as couchdb os daemon
  var daemon = bridge(process.stdin, process.stdout, function() {
    process.exit(0);
  });

  daemon.get({
    address: 'httpd.bind_address',
    port: 'httpd.port',
    auth: {
      username: pkg.name + '.username',
      password: pkg.name + '.password'
    }
  }, function(err, config) {
    if (err) {
      return process.exit(0);
    }

    pipeline(opts);
  });
};
