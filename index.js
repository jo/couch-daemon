/* couch-daemon
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var changes = require('./lib/changes');
var configure = require('./lib/configure');

var assert = require('assert');
var url = require('url');
var async = require('async');
var nano = require('nano');
var es = require('event-stream');
var JSONStream = require('JSONStream');


// used in client and test
var defaultLogger = function(name) {
  name = name || 'unknown';

  return {
    info: function(msg) {
      console.info('[' + new Date + '] [info] Daemon "' + name + '" :: ' + msg);
    },
    error: function(msg) {
      console.error('[' + new Date + '] [error] Daemon "' + name + '" :: ' + msg);
    },
    debug: function(msg) {
      console.log('[' + new Date + '] [debug] Daemon "' + name + '" :: ' + msg);
    },
  };
};


module.exports = function(options, config, logger) {
  options = options || {};
  config = config || {};
  logger = logger || defaultLogger(options.name);


  // defaults
  config.address = config.address || 'localhost';
  config.port = config.port || 5984;
  config.streams = config.streams && parseInt(config.streams, 10) || 20;
  config.timeout = config.timeout && parseInt(config.timeout, 10) || 60 * 1000;

  // validate config
  assert.equal(typeof config.streams, 'number', 'streams must be a number');
  assert.equal(parseInt(config.streams), config.streams, 'streams must be an interger');
  assert.ok(config.streams > 0, 'streams must be a positive non-zero');
  assert.equal(typeof config.timeout, 'number', 'timeout must be a number');
  assert.equal(parseInt(config.timeout), config.timeout, 'timeout must be an interger');
  assert.ok(config.timeout > 0, 'timeout must be a positive non-zero');

  assert.equal(typeof config.processor, 'function', 'processor must be a function');


  var couchUrl = url.format({
    protocol: 'http',
    hostname: config.address,
    port: config.port,
    auth: config.auth && config.auth.username && config.auth.password ? [ config.auth.username, config.auth.password ].join(':') : null
  });
  var couch = nano(couchUrl);

  var changesOptions = {
    feed: 'continuous',
    timeout: config.timeout
  };


  logger.info('Using options ' + JSON.stringify(config).replace(/"password":".*?"/, '"password":"***"'));


  function getConfig(task, next) {
    var name = couchUrl.replace(/:\/\/([^:]+):[^@]+@/, '://$1:***@') + '/' + task.dbname;

    logger.info('Listening on ' + name);
    
    task.db.list({
      startkey: '_design',
      endkey: '_design0',
      include_docs: true
    }, function(err, resp) {
      if (err) {
        logger.error('Failed to retrieve configuration for ' + name + ' (' + err.status_code + '): ' + err.message);
        return next();
      }

      es.pipeline(
        es.readArray(resp.rows),
        configure(options, task.config, logger)
      ).on('end', function() {
        listen(task, next);
      })
    });
  }

  function listen(task, next) {
    if (!task.config) {
      task.config = {};
      return getConfig(task, next);
    }

    changes(options, task.db, changesOptions, task.config, logger)
      .on('error', function(d) {
        logger.error(d);
        next();
      })
      .on('data', function(data) {
        if (data.response) {
          logger.info(data.response);
        }
      })
      .on('end', function() {
        // add to the end of queue
        q.push(task);
        next();
      });
  }

  var q = async.queue(listen, config.streams);

  function add(dbname) {
    q.push({
      dbname: dbname,
      db: couch.use(dbname)
    });
  }

  couch.db.list(function(err, dbs) {
    if (err) {
      logger.error('Can not get _all_dbs: ' + err.description);

      return process.exit(0);
    }

    dbs.forEach(add);
  });

  // TODO: listen to _db_updates
};
