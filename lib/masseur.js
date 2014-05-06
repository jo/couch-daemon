/* massage-couch
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var async = require('async');
var es = require('event-stream');

module.exports = function(options, db, config, logger) {
  function massage(data, done) {
    if (!data.doc) {
      return done(null);
    }

    if (!Object.keys(config).length) {
      return done(null);
    }

    function run(key, next) {
      try {
        options.processor(config, data.doc, db, next);
      } catch(e) {
        logger.error('Error running ' + key + ': ' + e);
        next();
      }
    }

    async.eachSeries(Object.keys(config), run, function() {
      done(null, data);
    });
  }

  return es.map(massage);
};
