var helper = require('./helper');

helper.withDB('db setup', function(couch, db, t, done) {
  t.ok(true, 'setup is ok');
  done();
});
