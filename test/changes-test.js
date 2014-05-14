var helper = require('./helper');
var changes = require('../lib/changes');

var _ = require('highland');

helper.withDB('piped from db stream', function(couch, db, t, done) {
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };
  var e = {
    stream: 'dbs',
    type: 'created',
    db_name: db.config.db
  };

  db.insert(doc, doc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    doc._rev = resp.rev;

    var stream = _.pipeline(
        _([e]),
        changes(couch.config.url)
      )
      .take(2)
      .toArray(function(results) {
        t.equal(results.length, 2, 'two results included');

        t.deepEqual(results[0], e, 'kickoff stream');

        t.equal(results[1].stream, 'changes', 'changes stream');
        t.equal(results[1].db_name, db.config.db, 'correct db_name present');
        t.equal(results[1].id, doc._id, 'doc id is present');

        done();
      });
  });
});
