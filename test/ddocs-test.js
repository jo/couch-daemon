var helper = require('./helper');
var ddocs = require('../lib/ddocs');

var _ = require('highland');

helper.withDB('piped from dbs', function(couch, db, t, done) {
  var docs = [
    {
      _id: '_design/myconfig',
      foo: 'bar'
    },
    {
      _id: '_design/otherconfig',
      foo: 'baz'
    }
  ];
  var e = {
    stream: 'dbs',
    type: 'created',
    db_name: db.config.db
  };

  db.bulk({ docs: docs }, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp[0].ok, 'no error on first ddoc');
    t.ok(resp[1].ok, 'no error on second ddoc');

    _.pipeline(
      _([e, e]),
      ddocs(couch.config.url)
    )
      .toArray(function(rows) {
        t.equal(rows.length, 6, 'six rows included');

        t.equal(rows[0].stream, 'ddocs', 'ddocs stream');
        t.equal(rows[0].id, docs[0]._id, 'ddoc emitted');

        t.equal(rows[1].stream, 'ddocs', 'ddocs stream');
        t.equal(rows[1].id, docs[1]._id, 'ddoc emitted');

        t.equal(rows[2].stream, 'dbs', 'dbs stream');
        t.equal(rows[2].type, 'created', 'db created');

        t.equal(rows[3].stream, 'ddocs', 'ddocs stream');
        t.equal(rows[3].id, docs[0]._id, 'ddoc emitted');

        t.equal(rows[4].stream, 'ddocs', 'ddocs stream');
        t.equal(rows[4].id, docs[1]._id, 'ddoc emitted');

        t.equal(rows[5].stream, 'dbs', 'dbs stream');
        t.equal(rows[5].type, 'created', 'db created');

        done();
      });
  });
});
