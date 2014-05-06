# couch-daemon
[![Build Status](https://travis-ci.org/jo/couch-daemon.svg?branch=master)](https://travis-ci.org/jo/couch-daemon)

CouchDB Daemon

## Contributing
Test your code with `npm test` and lint the code via `npm run jshint`.

You can set a different CouchDB url (and authentication credentials) via `COUCH` environment variable:
```shell
COUCH=http://user:password@localhost:5984 npm test
```

## License
Copyright (c) 2014 Johannes J. Schmidt, null2 GmbH  
Licensed under the MIT license.
