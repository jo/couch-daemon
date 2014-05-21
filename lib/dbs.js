/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * dbs - Create a stream of databases, filtered via black- and white lists.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var _ = require('highland');
var nano = require('nano');

// TODO: this will be done through nano when nano has updated follow:
var follow = require('follow');
var u = require('url');


module.exports = function(url, options) {
  options = options || {};

  var couch = nano(url);
  // TODO: this will be done through nano when nano has updated follow:
  // var feed = couch.db.follow('_db_updates', options);
  var feed = new follow.Feed(u.resolve(url, '_db_updates'));


  var dbs = _(function(push, done) {
    couch.db.list(function(err, resp) {
      if (err) {
        return push(err);
      }

      resp.forEach(function(dbname) {
        push(null, {
          stream: 'dbs',
          type: 'created',
          db_name: dbname
        });
      });

      // Listen to _db_updates and propagate events:
      // * created
      // * updated
      // * deleted
      feed.on('change', function(change) {
        push(null, _.extend({ stream: 'dbs' }, change));
      });
      feed.on('error', push);
      feed.follow();
    });
  });

  var stream = _.pipeline(
    dbs,

    _.filter(function(d) {
      return !options.whitelist || options.whitelist.indexOf(d.db_name) > -1;
    }),

    _.reject(function(d) {
      return options.blacklist && options.blacklist.indexOf(d.db_name) > -1;
    })
  );

  stream.on('end', function() {
    feed.stop();
  });

  return stream;
};
