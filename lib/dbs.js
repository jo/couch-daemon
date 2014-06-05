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

function compileRegexp(string) {
  if (string instanceof RegExp) {
    return string;
  }
  if (string.match(/^\/.*\/$/)) {
    string = string.slice(1, string.length - 1);
  } else {
    string = '^' + string + '$';
  }
  return new RegExp(string);
}


module.exports = function(url, options) {
  options = options || {};

  // TODO: RegExps with comma would break:
  // '_users,/prefix-[,-]+-suffix/,_replicator'
  if (typeof options.whitelist === 'string') {
    options.whitelist = options.whitelist.split(/,\s*/);
  }
  if (typeof options.blacklist === 'string') {
    options.blacklist = options.blacklist.split(/,\s*/);
  }

  if (options.whitelist) {
    if (!Array.isArray(options.whitelist)) {
      options.whitelist = [options.whitelist];
    }
    options.whitelist = options.whitelist.map(compileRegexp);
  }
  if (options.blacklist) {
    if (!Array.isArray(options.blacklist)) {
      options.blacklist = [options.blacklist];
    }
    options.blacklist = options.blacklist.map(compileRegexp);
  }


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
      // * deleted
      // Ignore 'updated' events.
      feed.on('change', function(change) {
        if (change.type === 'updated') {
          return;
        }
        push(null, _.extend({ stream: 'dbs' }, change));
      });
      feed.on('error', push);
      feed.follow();
    });
  });

  var stream = _.pipeline(
    dbs,

    // Whitelist
    _.filter(function(d) {
      return !options.whitelist || options.whitelist.some(function(r) {
        return d.db_name.match(r);
      });
    }),

    // Blacklist
    _.reject(function(d) {
      return options.blacklist && options.blacklist.some(function(r) {
        return d.db_name.match(r);
      });
    })
  );

  stream.on('end', function() {
    feed.stop();
  });

  return stream;
};
