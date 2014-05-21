# couch-daemon
High-level sugar for CouchDBs [`os_daemon`](http://docs.couchdb.org/en/latest/config/externals.html#os_daemons).
With a [Highland](http://highlandjs.org/) streaming interface.

[![Build Status](https://travis-ci.org/jo/couch-daemon.svg?branch=master)](https://travis-ci.org/jo/couch-daemon)

## Usage
couch-daemon provides high-level interface as well as low-level streams.
couch-daemon is built as a pipeline of six streams:

* `dbs`: Create a stream of databases, filtered via black- and white lists.
* `ddocs`: Fetch and emit design docs.
* `changes`: Create a global stream of changes.
* `compile`: Compile functions defined in ddocs.
* [your worker stream]
* `checkpoint`: Store last seq in checkpoint docs.
* `logger`: Print log events.

The idea is to store per database daemon configuration in design documents in an
object under the daemon name. The configuration cana have functions, like
filters or processors (see [couchmagick](https://github.com/jo/couchmagick) and
[massage-couch](https://github.com/jo/massage-couch)). couch-daemon looks at those configurations
and evaluates each function in a sandbox.
The actual daemon code is modelled as [through stream](http://highlandjs.org/#through).
It receives configuration as well as changes of each database it is configured
for. You can do anything you want inside that stream - make http calls to the outside,
query the database or run long computations. When you're done you emit the
original event to have couch-daemon store the checkpoint.
Do not hesitate to open a ticket if something is unclear - this was written a
bit in a hussle.

When using the high-level interface you do not need to handle `os_daemon` communication with
CouchDB, commandline option parsing nor set up the pipeline yourself. Just call
couch-daemon with your (optional) defaults and a stream and you're fine:
```js
require('couch-daemon')({ include_docs }, functions(url, options) {
  // url comes from daemon configuration,
  // as well as the options

  return function(source) {
    return source
      .filter...
      .group...
      .zip...
      .whatever...
  };
});
```

### Configuration
The daemon is set up in the `os_daemons` config section (eg. in local.ini):

```ini
[os_daemons]
mydaemon = mydaemon
```

The actual configuration is done under its own config section:
```ini
[mydaemon]
; Optional username and password, used by the workers to access the database
username = mein-user
password = secure
; Only documents in the databases above are processed (seperate with comma)
; whitelist = mydb,otherdb
; Ignore the following databases (again comma seperated list)
blacklist = _users,_replicator
```

### Commandline
couch-daemon makes it easy to test your daemon via commandline. couch-daemon
detects if it has been started interactively.
(Use `--daemon` argument for testing CouchDB os daemon interaction.)

When running interactively couch-daemon parses commandline options
and prints out log messages to console.


## Daemons in the wild
* [dimensionist](https://github.com/jo/dimensionist)
* [couchmagick](https://github.com/jo/couchmagick)
* TBD: [massage-couch](https://github.com/jo/massage-couch)

Send me a pull to add yours.

## Examples
An example daemon is included. It just prints out each change in all dbs:

```shell
./examples/logger.js --name my-daemon --blacklist _users
```

## Contributing
Write tests with [tap](https://github.com/isaacs/node-tap),
then test your code with `npm test`.

Specify CouchDB url and credentials via `COUCH` environment variable:
```shell
COUCH=http://user:password@localhost:5984 npm test
```

## License
Copyright (c) 2014 Johannes J. Schmidt, null2 GmbH  
Licensed under the MIT license.
