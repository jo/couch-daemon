/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * dbs - Create a stream of databases, filtered via black- and white lists.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var _ = require('highland');
var JSONStream = require('JSONStream');
var nano = require('nano');

// TODO: listen to _db_updates and propagate events:
// * created
// * updated
// * deleted
module.exports = function(url, options) {
  options = options || {};

  var couch = nano(url);


  return _.pipeline(
    couch.db.list(),

    JSONStream.parse('.*'),

    _.filter(function(dbname) {
      return !options.whitelist || options.whitelist.indexOf(dbname) > -1;
    }),

    _.reject(function(dbname) {
      return options.blacklist && options.blacklist.indexOf(dbname) > -1;
    }),

    _.map(function(dbname) {
      return {
        stream: 'dbs',
        type: 'created',
        db_name: dbname
      };
    })
  );
};
