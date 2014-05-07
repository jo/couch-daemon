/* couch-daemon
 * 
 * logger - print log events
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 */


var _ = require('highland');

module.exports = function(options) {
  options = options || {};


  options.name = options.name || 'unnamed';
  options.info = options.info || function(msg) {
    console.info('[' + new Date + '] [info] Daemon "' + options.name + '" :: ' + msg);
  };
  options.error = options.error || function(msg) {
    console.error('[' + new Date + '] [error] Daemon "' + options.name + '" :: ' + msg);
  };
  options.debug = options.debug || function(msg) {
    console.log('[' + new Date + '] [debug] Daemon "' + options.name + '" :: ' + msg);
  };


  return _.each(function(d) {
    if (d.type === 'log') {
      var level = d.level || 'info';

      if (typeof options[level] !== 'function') {
        options.error('Cannot log with level ' + level);
        return;
      }

      options[level](d.message);
    }
  });
};
