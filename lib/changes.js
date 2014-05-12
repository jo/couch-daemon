/* couch-daemon
 * 
 * changes - create a stream of changes while managing a sliding queue of n streams
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');
var async = require('async');
var JSONStream = require('JSONStream');

module.exports = function(options) {
  options = options || {};

  options.streams = options.streams || 1;

  var changesOptions = {
    include_docs: true
  };
  if (options.feed) {
    changesOptions.feed = options.feed;
  }
  if (options.timeout) {
    changesOptions.timeout = options.timeout;
  }
  if (options.limit) {
    changesOptions.limit = options.limit
  }

  var parseOptions = options.feed === 'continuous' ? null : 'results.*';


  function getChanges(db, options) {
    return _.pipeline(
      db.changes(options)
        .on('error', function() {}),

      JSONStream.parse(parseOptions),

      // remove last_seq present in continuous feed
      _.reject(function(result) {
        return 'last_seq' in result;
      })
    );
  }

  function isDbCreated(d) {
    return d.type === 'db:initialized'
      || d.type === 'db:created'
      || d.type === 'db:updated';
  }


var cnt = 0;
  return function(source) {
    var target = _(function(push, done) {
      var q = async.queue(function(task, next) {
        // TODO: check status doc unless task.options
        getChanges(task.db, _.extend(task.options, changesOptions))
          .on('data', function(d) {
            if (d.error) {
              task.error = d;
              push(d);
              done();
              return;
            }

            task.options.since = d.seq;

            var type = d.id.match(/^_design\//) ? 'ddoc' : 'doc';

            push(null, {
              type: 'change:' + type,
              db: task.db,
              seq: d.seq,
              doc: d.doc
            });
          })
          .on('error', function(d) {
            // do not add to queue again
            push(d);
            next();
          })
          .on('end', function(d) {
            // add to the end of queue
            cnt++;
            if (!task.error && cnt < 300) {
              q.push(task);
            }
            next();
          });
      }, options.streams);

      q.drain = done;

      // collect all dbs
      // have a queue
      // create a stream from all db changes
      source
        .on('data', function(data) {
          push(null, data);

          if (isDbCreated(data)) {
            q.push({
              db: data.db,
              options: {}
            });
          }
        })
        .on('error', push);
    });

    return target;
  };
};
