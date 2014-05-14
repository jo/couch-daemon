var helper = require('./helper');
var compile = require('../lib/compile');

var _ = require('highland');

helper.withDB('no function', function(couch, db, t, done) {
  var doc = {
    _id: '_design/myconfig',
    mydaemon: {
      foo: 'bar'
    }
  };
  var e = {
    db_name: db.config.db,
    id: '_design/myconfig',
    doc: doc
  };

  var stream = _.pipeline(
      _([e]),
      compile({ name: 'mydaemon' })
    )
    .take(2)
    .toArray(function(results) {
      t.equal(results.length, 2, 'both results included');
      t.deepEqual(results[0], e, 'kickoff event');

      t.equal(results[1].stream, 'compile', 'stream is "compile"');
      t.equal(results[1].db_name, db.config.db, 'db_name present');
      t.equal(results[1].id, e.id, 'id present');
      t.deepEqual(results[1].doc, doc.mydaemon, 'doc present and untouched');

      done();
    });
});

helper.withDB('single function', function(couch, db, t, done) {
  var doc = {
    _id: '_design/myconfig',
    mydaemon: {
      foo: 'function() {}'
    }
  };
  var e = {
    db_name: db.config.db,
    id: '_design/myconfig',
    doc: doc
  };

  var stream = _.pipeline(
      _([e]),
      compile({ name: 'mydaemon' })
    )
    .take(2)
    .toArray(function(results) {
      t.equal(results.length, 2, 'both results included');
      t.deepEqual(results[0], e, 'kickoff event');

      t.equal(results[1].stream, 'compile', 'stream is "compile"');
      t.equal(results[1].db_name, db.config.db, 'db_name present');
      t.equal(results[1].id, e.id, 'id present');
      t.type(results[1].doc, 'object', 'doc is an object');
      t.type(results[1].doc.foo, 'function', 'foo has been compiled');

      done();
    });
});

helper.withDB('toplevel function', function(couch, db, t, done) {
  var doc = {
    _id: '_design/myconfig',
    mydaemon: 'function() { return "toplevel :P" }'
  };
  var e = {
    db_name: db.config.db,
    id: '_design/myconfig',
    doc: doc
  };

  var stream = _.pipeline(
      _([e]),
      compile({ name: 'mydaemon' })
    )
    .take(2)
    .toArray(function(results) {
      t.equal(results.length, 2, 'both results included');
      t.deepEqual(results[0], e, 'kickoff event');

      t.equal(results[1].stream, 'compile', 'stream is "compile"');
      t.equal(results[1].db_name, db.config.db, 'db_name present');
      t.equal(results[1].id, e.id, 'id present');
      t.type(results[1].doc, 'function', 'foo has been compiled');

      done();
    });
});

