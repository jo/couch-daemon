/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * compile - Compile functions defined in ddocs.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var _ = require('highland');

module.exports = function(options) {
  options = options || {};


  // TODO: doit.
  return _.through(function(stream) {
    return stream;
  });
};
