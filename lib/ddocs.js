/* couch-daemon
 * 
 * ddocs - create a through stream which emits all ddocs after each db initial,
 * create or update.
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');
var JSONStream = require('JSONStream');

module.exports = function(options) {
  options = options || {};


  function getDdocs(db) {
    return db.list({
        startkey: '_design',
        endkey: '_design0',
        include_docs: true
      })
      .pipe(JSONStream.parse('rows.*'));
  }

  function isDbCreated(d) {
    return d.type === 'db:initialized'
      || d.type === 'db:created'
      || d.type === 'db:updated';
  }


  return function(source) {
    var target = _(function(push, done) {
      // on db: initialized, create, or update
      // - pause stream
      // - fetch all ddocs and emit them row by row
      // - emit db event
      // - resume stream
      source
        .on('data', function(data) {
          if (isDbCreated(data)) {
            source.pause();
            getDdocs(data.db)
              .on('data', function(d) {
                push(null, {
                  type: 'ddoc:initialized',
                  db: data.db,
                  doc: d.doc
                });
              })
              .on('error', push)
              .on('end', function() {
                push(null, data);
                source.resume();
              });
          } else {
            push(data);
          }
        })
        .on('error', push);
    });

    source.on('end', function() {
      target.end();
    });

    return target;
  };
};
