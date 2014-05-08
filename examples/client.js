#!/usr/bin/env node
/* couch-daemon
 * 
 * example client - log every document in every db
 *
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var _ = require('highland');

var client = require('../lib/client')(process.argv);
// You'll actually want this:
// var client = require('couch-daemon').client(process.argv);


// kick things of
_.pipeline(
  client.stream,
 
  
  _.filter(function(d) {
    return d.dbname && d.id;
  }),
  _.map(function(d) {
    return {
      type: 'log',
      message: 'processing: ' + d.dbname + '/' + d.id
    };
  }),


  client.checkpoint,
  client.logger
);
