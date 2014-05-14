/**
 * couch-daemon: High-level os daemon API for CouchDB
 *
 * compile - Compile functions defined in ddocs.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/couch-daemon
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var pkg = require('../package.json');

var _ = require('highland');
var vm = require('vm');

// Check if a string looks like a function.
// Supports /**/ and // comments before,
// anonymous and named functions
// as well as functions in paranthesis.
var IS_FUNCTION = /^(\s*\/\/.*\s*)*(\s*\/\*.*\/\s*)*\(?\s*function(\s+[a-zA-Z]+)?\s*\(/g;


module.exports = function(options) {
  options = options || {};
  options.name = options.name || pkg.name;

  var context = {
    log: options.info || console.log
  };

  function compile(str, id) {
    var source = '(' + str + ')';
    var name = id + '.js';
    var script = vm.createScript(source, name);

    return  script.runInNewContext(context);
  }

  function compileObj(obj, id) {
    if (typeof obj === 'string' && obj.match(IS_FUNCTION)) {
      return compile(obj, id);
    }

    if (typeof obj === 'object') {
      Object.keys(obj).forEach(function(key) {
        var name = [id, key].join('/');

        obj[key] = compileObj(obj[key], name);
      });
    }

    return obj;
  }

  function compileDoc(data, done) {
    var error = null;
    var config = {
      stream: 'compile',
      db_name: data.db_name,
      id: data.id
    };
    var doc = data.doc[options.name];

    try {
      config.doc = compileObj(doc, data.id);
    } catch(e) {
      error = { error: 'compile_error', reason: e };
    }

    done(error, error ? null : config);
  }


  return _.through(function(source) {
    var sourceEnded = false;

    var target = _(function(push, done) {
      source
        .on('data', function(data) {
          push(null, data);

          if (data && data.db_name && data.id && data.id.match(/^_design\//) && data.doc && data.doc[options.name]) {
            compileDoc(_.extend({}, data), function(err, config) {
              push(err, config);

              if (sourceEnded) {
                push(null, _.nil);
              }
            });
          }
        })
        .on('error', push);
    });

    source.on('end', function() {
      sourceEnded = true;
    });

    return target;
  });
};
