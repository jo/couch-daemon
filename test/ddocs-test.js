var helper = require('./helper');
var ddocs = require('../lib/ddocs');

helper.withDB('single ddoc', function(couch, db, t, done) {
  var ddoc = {
    _id: '_design/myconfig',
    foo: 'bar'
  };

  db.insert(ddoc, ddoc._id, function(err, resp) {
    t.equal(err, null, 'no error');
    t.ok(resp.ok, 'no error');

    ddoc._rev = resp.rev;

    ddocs(db).toArray(function(rows) {
      t.equal(rows.length, 1, 'one row included');
      t.equal(rows[0].id, ddoc._id, 'ddoc id is present');
      t.deepEqual(rows[0].doc, ddoc, 'ddoc is present');
      done();
    });
  });
});
