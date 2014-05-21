var helper = require('./helper');
var dbs = require('../lib/dbs');

helper.withDB('initial db', function(couch, db, t, done) {
  var stream = dbs(couch.config.url);

  setTimeout(function() {
    stream.end();
  }, 300);

  stream
    .map(function(d) {
      return d.db_name;
    })
    .toArray(function(rows) {
      t.ok(rows.indexOf('_users') > -1, '_users db included');
      done();
    });
});

helper.withDB('whitelist', function(couch, db, t, done) {
  var stream = dbs(couch.config.url, { whitelist: [db.config.db] });

  setTimeout(function() {
    stream.end();
  }, 300);

  stream
    .toArray(function(rows) {
      t.equal(rows.length, 1, 'one row included');
      t.equal(rows[0].stream, 'dbs', 'stream is dbs');
      t.equal(rows[0].type, 'created', 'type is created');
      t.equal(rows[0].db_name, db.config.db, db.config.db + ' included');
      done();
    });
});

helper.withDB('blacklist', function(couch, db, t, done) {
  var stream = dbs(couch.config.url, { blacklist: ['_users'] });

  setTimeout(function() {
    stream.end();
  }, 300);

  stream
    .map(function(d) {
      return d.db_name;
    })
    .toArray(function(rows) {
      t.equal(rows.indexOf('_users'), -1, '_users not included');
      done();
    });
});

