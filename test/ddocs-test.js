var helper = require('./helper');
var ddocs = require('../lib/ddocs');

var _ = require('highland');

helper.withDB('single ddoc', function(couch, db, t, done) {
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
    type: 'db:initialized',
    db: db
  };

  db.bulk({ docs: docs }, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp[0].ok, 'no error on first ddoc');
    t.ok(resp[1].ok, 'no error on second ddoc');

    _.pipeline(
      _([e, e]),
      ddocs()
    ).toArray(function(rows) {
      t.equal(rows.length, 6, 'four rows included');
      t.equal(rows[0].type, 'ddoc:initialized', 'first ddoc:initialized');
      t.equal(rows[1].type, 'ddoc:initialized', 'second ddoc:initialized');
      t.equal(rows[2].type, 'db:initialized', 'first db:initialized');
      t.equal(rows[3].type, 'ddoc:initialized', 'first ddoc:initialized');
      t.equal(rows[4].type, 'ddoc:initialized', 'second ddoc:initialized');
      t.equal(rows[5].type, 'db:initialized', 'second db:initialized');
      done();
    });
  });
});
