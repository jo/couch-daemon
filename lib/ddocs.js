/* couch-daemon
 * 
 * ddocs - create a stream of all design docs
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');
var JSONStream = require('JSONStream');

module.exports = function(db) {
  return _.pipeline(
    db.list({
      startkey: '_design',
      endkey: '_design0',
      include_docs: true
    }),

    JSONStream.parse('rows.*')
  );
};
