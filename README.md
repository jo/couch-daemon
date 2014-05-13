# couch-daemon
[![Build Status](https://travis-ci.org/jo/couch-daemon.svg?branch=master)](https://travis-ci.org/jo/couch-daemon)   
High-level os daemon API for CouchDB.

# This is work in progress!
Everything can change.

## Daemons in the wild
* [couchmagick](https://github.com/jo/couchmagick) TBD
* [massage-couch](https://github.com/jo/massage-couch) TBD

(Send me a pull to add yours.)

## Examples
An example client is included, which just prints out each doc in each dbs:

```shell
./examples/client.js --name my-daemon
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
