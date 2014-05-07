/* couch-daemon
 * 
 * dbs - create a stream of all dbs, filtered by black- and white lists
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');
var JSONStream = require('JSONStream');

// TODO: listen to _db_updates
module.exports = function(couch, options) {
  options = options || {};


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
        type: 'initial',
        db_name: dbname
      };
    })
  );
};
