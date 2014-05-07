/* couch-daemon
 * 
 * changes - create a stream of changes
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');
var JSONStream = require('JSONStream');

module.exports = function(db, options) {
  options = options || {};

  options.include_docs = true;
  options.feed = options.feed || 'continuous';

  var parseOptions = options.feed === 'continuous' ? null : 'results.*';

  return _.pipeline(
    db.changes(options),

    JSONStream.parse(parseOptions),

    // remove last_seq present in continuous feed
    _.reject(function(result) {
      return 'last_seq' in result;
    })
  );
};
