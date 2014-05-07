/* couch-daemon
 * 
 * stream - concatinates a global changes feed as well as ddocs,
 * which are fetched once at first
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var dbs = require('./dbs');
var ddocs = require('./ddocs');
var changes = require('./changes');

var _ = require('highland');
var async = require('async');

module.exports = function(couch, options) {
  options = options || {};


  options.streams = options.streams || 1;


  var changesOptions = {};
  if (options.feed) {
    changesOptions.feed = options.feed;
  }
  if (options.timeout) {
    changesOptions.timeout = options.timeout;
  }
  if (options.limit) {
    changesOptions.limit = options.limit
  }


  var dbsOptions = {};
  if (options.whitelist) {
    dbsOptions.whitelist = options.whitelist;
  }
  if (options.blacklist) {
    dbsOptions.blacklist = options.blacklist;
  }


  // TODO: stop substreams when this stream is ended from outside,
  // eg. by calling .destroy() or .end()
  return _(function(push, done) {
    var q = async.queue(listen, options.streams);

    q.drain = done;


    function listen(task, next) {
      if (!task.ddocs_fetched) {
        task.ddocs_fetched = true;

        return ddocs(task.db)
          .on('data', function(d) {
            push(null, {
              type: 'ddoc',
              db: task.db,
              dbname: task.dbname,
              id: d.id,
              doc: d.doc
            });
          })
          .on('error', function(d) {
            // do not add to queue again
            push(d);
            next();
          })
          .on('end', function() {
            // add to the end of queue
            q.push(task);
            next();
          });
      }


      // TODO: check status doc
      changes(task.db, _.extend(task.options, changesOptions))
        .on('data', function(d) {
          if (d.error) {
            task.error = d;
            return push(d);
          }

          task.options.since = d.seq;

          push(null, {
            type: 'change',
            db: task.db,
            dbname: task.dbname,
            id: d.id,
            seq: d.seq,
            doc: d.doc
          });
        })
        .on('error', function(d) {
          // do not add to queue again
          push(d);
          next();
        })
        .on('end', function() {
          // add to the end of queue
          if (!task.error) {
            q.push(task);
          }
          next();
        });
    }

    
    dbs(couch, dbsOptions)
      .on('data', function(change) {
        // TODO: check change.type
        q.push({
          dbname: change.db_name,
          db: couch.use(change.db_name),
          options: {}
        });
      })
      .on('error', function() {
        process.exit();
      });
  });
};
