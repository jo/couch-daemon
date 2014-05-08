/* couch-daemon
 * 
 * checkpoint - store last seq in checkpoint docs
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');

module.exports = function(db, options) {
  options = options || {};

  // TODO: doit
  // store checkpont every time we see a seq
  // with optional throttling
  return _.pipeline();
};
