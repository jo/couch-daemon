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

var pkg = require('../package.json');
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


module.exports = function(defaults, worker) {
  if (typeof defaults === 'function') {
    worker = defaults;
    defaults = {};
  }

  defaults.name = defaults.name || pkg.name;


  function pipeline(options) {
    options = options || {};


    if (options.version) {
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

    if (typeof options.whitelist === 'string') {
      options.whitelist = options.whitelist.split(/,\s*/);
    }
    if (typeof options.blacklist === 'string') {
      options.blacklist = options.blacklist.split(/,\s*/);
    }


    var couch = url.format({
      protocol: 'http',
      hostname: options.address || 'localhost',
      port: options.port || 5984,
      auth: options.auth && options.auth.username && options.auth.password ? [ options.auth.username, options.auth.password ].join(':') : null
    });


    // use defaults
    var opts = _.extend(options, defaults);

    // fire the worker pipeline
    _.pipeline(
      dbs(couch, opts),
      ddocs(couch, opts),
      changes(couch, opts),
      compile(couch, opts),

      worker(couch, opts),

      checkpoint(couch, opts),
      logger(couch, opts)
    );
  }



  // running interactively
  if (process.stdin.isTTY) {
    var opts = minimist(process.argv.slice(2), {
      booleans: ['version', 'daemon']
    });
    if (!opts.daemon) {
      return pipeline(opts);
    }
  }


  // running as couchdb os daemon
  var daemon = bridge();

  daemon.get({
    address: 'httpd.bind_address',
    port: 'httpd.port',
    daemonOptions: defaults.name
  }, function(err, opts) {
    if (err) {
      return process.exit(0);
    }

    var daemonOptions = opts.daemonOptions;
    delete opts.daemonOptions;

    opts = _.extend(daemonOptions, opts);

    opts.info = daemon.info;
    opts.error = daemon.error;
    opts.debug = daemon.debug;


    pipeline(opts);
  });
};
