/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * ddocs - Create a stream of design docs.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var _ = require('highland');
var nano = require('nano');

module.exports = function(url, options) {
  options = options || {};

  var couch = nano(url);


  function getDdocs(db, done) {
    couch.use(db).list({
      startkey: '_design',
      endkey: '_design0',
      include_docs: true
    }, done);
  }

  return _.through(function(source) {
    var sourceEnded = false;

    var target = _(function(push, done) {
      // on db create, or update
      // - pause stream
      // - fetch all ddocs and emit them row by row
      // - emit db event
      // - resume stream
      source
        .on('data', function(data) {
          if (data && data.stream === 'dbs' && data.db_name && (data.type === 'created' || data.type === 'updated')) {
            source.pause();

            getDdocs(data.db_name, function(err, resp) {
              if (!err) {
                resp.rows.forEach(function(row) {
                  var d = _.extend({ stream: 'ddocs', db_name: data.db_name }, row);

                  push(null, d);
                });
              }

              push(null, data);
              source.resume();

              if (sourceEnded) {
                push(null, _.nil);
              }
            });
          } else {
            push(null, data);
          }
        })
        .on('error', push);
    });

    source.on('end', function() {
      sourceEnded = true;
    });

    return target;
  });
};
