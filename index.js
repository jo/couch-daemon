/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */


module.exports = require('./lib/daemon');

module.exports.dbs = require('./lib/dbs');
module.exports.ddocs = require('./lib/ddocs');
module.exports.changes = require('./lib/changes');
module.exports.compile = require('./lib/compile');
module.exports.checkpoint = require('./lib/checkpoint');
module.exports.logger = require('./lib/logger');

