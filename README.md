# couch-daemon
[![Build Status](https://travis-ci.org/jo/couch-daemon.svg?branch=master)](https://travis-ci.org/jo/couch-daemon)

Abstract daemon code for building CouchDB daemons.

## Daemons in the wild
* [couchmagick](https://github.com/jo/couchmagick) TBD
* [massage-couch](https://github.com/jo/massage-couch) TBD

(Send me a pull to add yours.)

## Examples
An example client is included, which just prints out each doc in each dbs:

```shell
./examples/client.js --streams 100 --limit 1000 --timeout 1000 --name my-daemon
```

## Contributing
Write tests with [tap](https://github.com/isaacs/node-tap),
then test your code with `npm test`.

You can set a different CouchDB url (and authentication credentials) via `COUCH` environment variable:
```shell
COUCH=http://user:password@localhost:5984 npm test
```

## License
Copyright (c) 2014 Johannes J. Schmidt, null2 GmbH  
Licensed under the MIT license.
