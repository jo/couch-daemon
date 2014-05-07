var url = process.env.COUCH || 'http://localhost:5984';
var dbname = 'mydaemon-test';

var test = require('tap').test;
var nano = require('nano');


exports.withDB = function(name, tests) {
  test(name, function(t) {
    var couch = nano(url);

    couch.db.create(dbname, function(err, resp) {
      t.equal(err, null, 'no error');
      t.deepEqual(resp, { ok: true }, 'no error');

      couch.db.get(dbname, function(err, body) {
        t.equal(err, null, 'no error');
        t.deepEqual(body.db_name, dbname, 'operating on correct db');

        tests(couch, couch.use(dbname), t, function() {
          couch.db.destroy(dbname, function(err, resp) {
            t.equal(err, null, 'no error');
            t.deepEqual(resp, { ok: true }, 'no error');

            t.end();
          });
        });
      });
    });
  });
}
