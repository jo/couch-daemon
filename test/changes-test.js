var helper = require('./helper');
var changes = require('../lib/changes');

helper.withDB('single doc', function(couch, db, t, done) {
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };

  db.insert(doc, doc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    doc._rev = resp.rev;

    changes(db, { feed: 'poll' }).toArray(function(results) {
      t.equal(results.length, 1, 'one result included');
      t.equal(results[0].id, doc._id, 'doc id is present');
      t.deepEqual(results[0].doc, doc, 'doc is present');
      done();
    });
  });
});

helper.withDB('continuous feed', function(couch, db, t, done) {
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };

  db.insert(doc, doc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    doc._rev = resp.rev;

    changes(db, { feed: 'continuous', timeout: 1 }).toArray(function(results) {
      t.equal(results.length, 1, 'one result included');
      t.equal(results[0].id, doc._id, 'doc id is present');
      t.deepEqual(results[0].doc, doc, 'doc is present');
      done();
    });
  });
});
