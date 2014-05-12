var helper = require('./helper');
var dbs = require('../lib/dbs');

helper.withDB('initial db', function(couch, db, t, done) {
  dbs(couch)
    .filter(function(d) {
      return d.db.config.db === db.config.db || d.db.config.db === '_users';
    })
    .toArray(function(rows) {
      t.equal(rows.length, 2, 'two rows included');
      done();
    });
});

helper.withDB('whitelist', function(couch, db, t, done) {
  dbs(couch, { whitelist: [db.config.db] })
    .toArray(function(rows) {
      t.equal(rows.length, 1, 'one row included');
      t.equal(rows[0].type, 'db:initialized', 'type is initialized');
      t.equal(rows[0].db.config.db, db.config.db, db.config.db + ' included');
      t.type(rows[0].db, 'object', 'db is an object');
      t.type(rows[0].db.config, 'object', 'db.config is an object');
      t.equal(rows[0].db.config.url, db.config.url, 'db.config.url is set to correct url: ' + db.config.url);
      t.equal(rows[0].db.config.db, db.config.db, 'db.config.db is set to correct db: ' + db.config.db);
      done();
    });
});

helper.withDB('blacklist', function(couch, db, t, done) {
  dbs(couch, { blacklist: ['_users'] })
    .filter(function(d) {
      return d.db.config.db === '_users';
    })
    .toArray(function(rows) {
      t.equal(rows.length, 0, 'no row included');
      done();
    });
});
