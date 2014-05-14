/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * checkpoint - Store last seq in checkpoint docs.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var pkg = require('../package.json');

var _ = require('highland');
var nano = require('nano');

// TODO: implement throttling
module.exports = function(url, options) {
  options = options || {};
  options.name = options.name || pkg.name;

  var couch = nano(url);
  var checkpointId = '_local/' + options.name;

  function writeCheckpoint(db, seq, done) {
    db.get(checkpointId, function(err, doc) {
      doc = doc || { _id: checkpointId };
      
      if (doc.last_seq && doc.last_seq >= seq) {
        return done(null, { stream: 'checkpoint', type: 'skip' });
      }

      doc.last_seq = seq;
      db.insert(doc, checkpointId, function(err) {
        if (err) {
          return done({ stream: 'checkpoint', error: err.error, reason: err.reason });
        }

        done(null, { stream: 'checkpoint', type: 'updated', seq: seq });
      });
    });
  }


  return _.through(function(source) {
    var sourceEnded = false;

    var target = _(function(push, done) {
      source
        .on('data', function(data) {
          push(null, data);

          if (data && data.db_name && data.seq) {
            source.pause();
            writeCheckpoint(couch.use(data.db_name), data.seq, function(err, d) {
              push(err, d);
              source.resume();

              if (sourceEnded) {
                push(null, _.nil);
              }
            });
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
