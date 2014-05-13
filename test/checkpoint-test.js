var helper = require('./helper');
var checkpoint = require('../lib/checkpoint');

var _ = require('highland');
var JSONStream = require('JSONStream');

helper.withDB('single doc', function(couch, db, t, done) {
  var e = {
    db_name: db.config.db,
    seq: 1
  };

  _.pipeline(
    _([e]),
    checkpoint(couch.config.url)
  ).toArray(function(rows) {
    t.equal(rows.length, 2, 'two rows included');
    t.deepEqual(rows[0], e, 'trigger event emitted');
    t.equal(rows[1].stream, 'checkpoint', 'checkpont stream');
    t.equal(rows[1].type, 'updated', 'type is updated');
    t.equal(rows[1].seq, e.seq, 'seq is emitted');

    done();
  });
});
