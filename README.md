# couch-daemon
[![Build Status](https://travis-ci.org/jo/couch-daemon.svg?branch=master)](https://travis-ci.org/jo/couch-daemon)

Abstract daemon code for building CouchDB daemons.

## Daemons in the wild
* [couchmagick](https://github.com/jo/couchmagick)
* [massage-couch](https://github.com/jo/massage-couch)

(Send me a pull to add yours.)

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
