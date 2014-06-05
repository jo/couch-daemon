var helper = require('../helper');
var dbs = require('../../lib/dbs');
var changes = require('../../lib/changes');

var _ = require('highland');

helper.withDB('piped from db stream', function(couch, db, t, done) {
  var dbname = 'newly-created-db';
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };
  
  var stream = _.pipeline(
    dbs(couch.config.url, { whitelist: [db.config.db, dbname] }),
    changes(couch.config.url)
  );

  setTimeout(function() {
    stream.end();
  }, 300);

  couch.db.create(dbname, function(err, resp) {
    t.equal(err, null, 'no error');

    couch.use(dbname).insert(doc, doc._id, function(err, resp) {
      t.equal(err, null, 'no error');
      t.ok(resp.ok, 'no error');

      doc._rev = resp.rev;

      stream
        .take(3)
        .toArray(function(results) {
          console.log(results);
          t.equal(results.length, 3, 'three results included');

          t.deepEqual(results[0], {
            stream: 'dbs',
            type: 'created',
            db_name: db.config.db
          }, db.config.db + ' created event');

          t.deepEqual(results[1], {
            stream: 'dbs',
            type: 'created',
            db_name: dbname
          }, dbname + ' created event');

          t.deepEqual(results[2], {
            stream: 'changes',
            db_name: dbname,
            seq: 1,
            id: doc._id,
            changes: [
              { rev: doc._rev }
            ]
          }, 'change event');

          couch.db.destroy(dbname, function(err, resp) {
            t.equal(err, null, 'no error');
            done();
          });
        });
    });
  });
});
