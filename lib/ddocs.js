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
var JSONStream = require('JSONStream');
var nano = require('nano');

module.exports = function(url, options) {
  options = options || {};

  var couch = nano(url);


  function getDdocs(db) {
    return _.pipeline(
      couch.use(db).list({
        startkey: '_design',
        endkey: '_design0',
        include_docs: true
      }),

      JSONStream.parse('rows.*'),

      _.map(function(d) {
        return _.extend({ stream: 'ddocs', db_name: db }, d);
      })
    );
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
          if (data.stream === 'dbs' && data.db_name && (data.type === 'created' || data.type === 'updated')) {
            source.pause();
            getDdocs(data.db_name)
              .on('data', function(d) {
                push(null, d);
              })
              .on('error', push)
              .on('end', function() {
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
