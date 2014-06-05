/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * changes - Create a stream of changes.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var pkg = require('../package.json');

var _ = require('highland');
var nano = require('nano');

module.exports = function(url, options) {
  options = options || {};
  options.name = options.name || pkg.name;

  var couch = nano(url);
  var feeds = {};
  var checkpointId = '_local/' + options.name;

  function getCheckpoint(db, done) {
    db.get(checkpointId, function(err, doc) {
      done(doc);
    });
  }


  // on each db event open a changes stream
  return _.through(function(source) {
    return _(function(push, done) {
      source.on('data', function(data) {
        push(null, data);

        if (data && data.stream === 'dbs' && data.db_name) {
          if (feeds[data.db_name]) {
            feeds[data.db_name].stop();
          }

          if (data.type === 'created' || data.type === 'updated') {
            var db = couch.use(data.db_name);
            getCheckpoint(db, function(doc) {
              var opts = doc ? { since: doc.last_seq } : {};

              feeds[data.db_name] = db.follow(_.extend(options, opts))
                .on('error', push)
                .on('change', function(change) {
                  push(null, _.extend({ stream: 'changes', db_name: data.db_name }, change));
                });
              feeds[data.db_name].follow();
            });
          }
        }
      });

      source.on('end', function() {
        Object.keys(feeds).forEach(function(db) {
          feeds[db].stop();
        });
      });
    });
  });
};
