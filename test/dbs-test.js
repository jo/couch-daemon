var helper = require('./helper');
var dbs = require('../lib/dbs');

helper.withDB('initial db', function(couch, db, t, done) {
  dbs(couch.config.url)
    .filter(function(d) {
      return d.db_name === db.config.db || d.db_name === '_users';
    })
    .toArray(function(rows) {
      t.equal(rows.length, 2, 'two rows included');
      done();
    });
});

helper.withDB('whitelist', function(couch, db, t, done) {
  dbs(couch.config.url, { whitelist: [db.config.db] })
    .toArray(function(rows) {
      t.equal(rows.length, 1, 'one row included');
      t.equal(rows[0].stream, 'dbs', 'stream is dbs');
      t.equal(rows[0].type, 'created', 'type is created');
      t.equal(rows[0].db_name, db.config.db, db.config.db + ' included');
      done();
    });
});

helper.withDB('blacklist', function(couch, db, t, done) {
  dbs(couch.config.url, { blacklist: ['_users'] })
    .filter(function(d) {
      return d.db_name === '_users';
    })
    .toArray(function(rows) {
      t.equal(rows.length, 0, 'no row included');
      done();
    });
});
