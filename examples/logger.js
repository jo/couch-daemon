#!/usr/bin/env node
/* couch-daemon
 * 
 * example daemon: logger- Log every document in every db.
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var daemon = require('..');


daemon(function(source) {
  var count = 0;

  return source
    .map(function(data) {
      if (data.stream === 'dbs' && data.db_name) {
        return {
          type: 'log',
          message: 'listening on: ' + data.db_name
        };
      }
      if (data.db_name && data.id && data.seq) {
        count++;
        return {
          type: 'log',
          message: 'processing (' + count + '): ' + data.db_name + '/' + data.id + '@' + data.seq,
          db_name: data.db_name,
          seq: data.seq
        };
      }
      return data;
    });
});

