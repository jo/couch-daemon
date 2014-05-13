/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * logger - Print log events.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var pkg = require('../package.json');

var _ = require('highland');

module.exports = function(options) {
  options = options || {};
  options.name = options.name || pkg.name;
  options.info = options.info || function(msg) {
    console.info('[' + new Date + '] [info] Daemon "' + options.name + '" :: ' + msg);
  };
  options.error = options.error || function(msg) {
    console.error('[' + new Date + '] [error] Daemon "' + options.name + '" :: ' + msg);
  };
  options.debug = options.debug || function(msg) {
    console.log('[' + new Date + '] [debug] Daemon "' + options.name + '" :: ' + msg);
  };


  return _.each(function(d) {
    if (d.type === 'log') {
      var level = d.level || 'info';

      if (typeof options[level] !== 'function') {
        options.error('Cannot log with level ' + level);
        return;
      }

      options[level](d.message);
    }
  });
};
