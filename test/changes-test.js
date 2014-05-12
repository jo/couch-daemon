var helper = require('./helper');
var changes = require('../lib/changes');

var _ = require('highland');

helper.withDB('single doc', function(couch, db, t, done) {
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };
  var e = {
    type: 'db:initialized',
    db: db
  };

  db.insert(doc, doc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    doc._rev = resp.rev;

    _.pipeline(
      _([e]),
      changes({ feed: 'poll' }),
      _.take(2)
    ).toArray(function(results) {
      t.equal(results.length, 2, 'two result lines included');
      t.equal(results[0].type, 'db:initialized', 'first result has correct db:initialized type');
      t.equal(results[1].type, 'change:doc', 'second result has correct change:doc type');
      t.deepEqual(results[1].doc, doc, 'doc is present');
      done();
    });
  });
});

helper.withDB('continuous feed', function(couch, db, t, done) {
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };
  var e = {
    type: 'db:initialized',
    db: db
  };

  db.insert(doc, doc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    doc._rev = resp.rev;

    _.pipeline(
      _([e]),
      changes({ feed: 'continuous', timeout: 1 }),
      _.take(2)
    ).toArray(function(results) {
      t.equal(results.length, 2, 'two result lines included');
      t.equal(results[0].type, 'db:initialized', 'first result has correct db:initialized type');
      t.equal(results[1].type, 'change:doc', 'second result has correct change:doc type');
      t.deepEqual(results[1].doc, doc, 'doc is present');
      done();
    });
  });
});
