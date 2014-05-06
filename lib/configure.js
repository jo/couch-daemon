/* massage-couch
 * (c) 2014 Johannes J. Schmidt, null2 GmbH, Berlin 
 */

var es = require('event-stream');
var vm = require('vm');


module.exports = function(options, config, logger) {
  // context used to compile function
  var context = {
    log: logger.info
  };


  function isConfigDoc(doc) {
    return doc &&
      doc._id.match(/^_design\//) &&
      typeof doc[options.name] === 'object';
  }


  // recursive compile filters
  // TODO: compile process functions. How to call them?
  function traverse(obj, name) {
    var result = {};

    Object.keys(obj).forEach(function(key) {
      var value;

      var n = [name, key].join('/');

      if (key === 'filter') {
        value = compile(obj[key], name);
      }
      if (typeof obj[key] === 'object') {
        value = traverse(obj[key], n);
      }

      result[key] = value;
    });

    return result;
  }


  // compile function
  function compile(string, name) {
    var fun;
    var source = '(' + string + ')';
    var filename = options.name + ':' + name + '.js';

    logger.info('Compiling ' + name);

    try {
      var script = vm.createScript(source, filename);
      fun = script.runInNewContext(context);
    } catch(e) {
      logger.error('Error compiling ' + name + ': ' + e);
      fun = null;
    }

    return fun;
  }

  // prepare config
  // * check if toplevel is string, then compile like here
  // * if toplevel is object, then compile filter if present (recursive)
  function use(obj, id) {
    Object.keys(obj).forEach(function(key) {
      var value;

      var name = [id, options.name, key].join('/');

      if (typeof obj[key] === 'string') {
        value = compile(obj[key], name);
      }
      if (typeof obj[key] === 'object') {
        value = traverse(obj[key], name);
      }

      config[name] = value;
    });
  }


  function configure(data, done) {
    if (isConfigDoc(data.doc)) {
      use(data.doc[options.name], data.id, context);
    }

    done(null, data);
  }

  return es.map(configure);
};
