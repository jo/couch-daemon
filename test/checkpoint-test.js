var helper = require('./helper');
var checkpoint = require('../lib/checkpoint');

var _ = require('highland');
var JSONStream = require('JSONStream');

helper.withDB('single doc', function(couch, db, t, done) {
  var doc = {
    _id: 'mydoc',
    foo: 'bar'
  };
  var checkpointDoc = {
    _id: '_local/mycheckpoint',
    foo: 'bar'
  };
  var e = {
    type: 'complete',
    db: db,
    checkpoint: checkpointDoc,
    seq: 1
  };

  db.insert(doc, doc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    doc._rev = resp.rev;

    _.pipeline(
      _([e]),
      checkpoint()
    ).toArray(function(rows) {
      t.equal(rows.length, 2, 'two rows included');
      t.equal(rows[0].type, 'complete', 'first row is completed');
      t.deepEqual(rows[0].checkpoint, checkpointDoc, 'checkpoint doc is present');
      t.equal(rows[1].type, 'checkpointed', 'second row is checkpointed');
      t.deepEqual(rows[1].checkpoint, checkpointDoc, 'checkpoint doc is present');
      t.ok(rows[1].checkpoint._rev, 'checkpoint doc has rev');

      done();
    });
  });
});
