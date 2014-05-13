#!/usr/bin/env node
/* couch-daemon
 * 
 * example client - log every document in every db
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var client = require('../lib/client')(process.argv);

// You'll actually want this:
// var client = require('couch-daemon').client(process.argv);


client(function(s) {
  return s.filter(function(d) {
    return d.db_name && d.id && d.seq;
  })
  .map(function(d) {
    return {
      type: 'log',
      message: 'processing: ' + d.db_name + '/' + d.id + '@' + d.seq,
      db_name: d.db_name,
      seq: d.seq
    };
  });
});

