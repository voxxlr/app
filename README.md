# Voxxlr App SDK
This repository contains the App infrastructure of the [Voxxlr](https://www.voxxlr.com) cloud platform for geospatial content. A small web server in __server.js__ runs a demo locally, but it does not fully implement the required REST Api. 

## Installation

There are two ways to run the _app_ server using either docker or nodejs. In either case, the [_doc_ server](https://github.com/voxxlr/doc) must be running as well in order to load datasets. Once the the _app_ server is running, point the browser to http://127.0.0.1/launchpad.html.

#### Nodejs

Nodejs and npm must be installed.

```javascript
cd app
npm  install
node server.js
```

#### Docker

Docker engine must be installed.

```javascript
cd app
docker-build.sh
docker-run.sh
```

## License
The Voxxlr App SDK is licensed under the Affero GPL V3 license.
