var helper = require('./helper');
var checkpoint = require('../lib/checkpoint');

var _ = require('highland');
var JSONStream = require('JSONStream');

helper.withDB('single doc', function(couch, db, t, done) {
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };

  db.insert(doc, doc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    doc._rev = resp.rev;

    _.pipeline(
      db.changes({ include_docs: true }),
      JSONStream.parse('results.*'),
      checkpoint()
    ).toArray(function(rows) {
      t.equal(rows.length, 1, 'one row included');
      t.ok(rows[0].seq, 'seq is present');
      t.equal(rows[0].id, doc._id, 'doc id is present');
      t.deepEqual(rows[0].doc, doc, 'doc is present');

      // the next row is the checkpoint event

      done();
    });
  });
});
