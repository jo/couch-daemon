/* massage-couch
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */


var pkg = require('../package.json');
var masseur = require('./masseur');
var configure = require('./configure');

var util = require('util');
var es = require('event-stream');
var JSONStream = require('JSONStream');

var noop = function() {};


module.exports = function changes(options, db, changesOptions, config, logger) {
  var statusDoc = {
    _id: '_local/' + pkg.name,
    last_seq: 0
  };
  var lastSeq;
  var changesParserOptions = changesOptions.feed === 'continuous' ? null : 'results.*';
  var changesOptions.include_docs = true;


  function storeCheckpoint(seq) {
    if (statusDoc.last_seq === seq) {
      return;
    }

    statusDoc.last_seq = seq;
    db.head(statusDoc._id, function(err, _, headers) {
      if (!err && headers && headers.etag) {
        statusDoc._rev = JSON.parse(headers.etag);
      }
      db.insert(statusDoc, statusDoc._id);
    });
  }

  return es.pipeline(
    // kick off
    es.readArray([1]),

    // open changes feed
    es.through(function write() {
      var queue = this.queue;

      // request status doc
      db.get(statusDoc._id, function(err, doc) {
        util._extend(statusDoc, doc || {});

        changesOptions.since = statusDoc.last_seq;
  

        es.pipeline(
          // listen to changes
          db.changes(changesOptions)
            .on('data', queue)
            .on('end', function() {
              queue(null);
            }),

          // parse last seq
          JSONStream.parse('last_seq'),

          // store lastSeq
          es.map(function(data, done) {
            lastSeq = data;
            done(null, data);
          })
        );
      });
    }, noop),

    // parse changes feed
    JSONStream.parse(changesParserOptions),

    // update config
    configure(options, config, logger),

    // run through masseur
    masseur(options, db, config, logger)
  )
  // store checkpoint after completed
  .on('completed', function(data) {
    storeCheckpoint(data.seq);
  })
  // store checkpoint at the end
  .on('end', function() {
    if (lastSeq) {
      storeCheckpoint(lastSeq);
    }
  });
};
