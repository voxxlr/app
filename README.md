# Voxxlr App SDK
This repository contains the App infrastructure of the [Voxxlr](https://www.voxxlr.com) cloud platform for geospatial content. All files in this repository 
are hosted at voxxlr.github.io/app and the REST Api is hosted and documented at [https://app.voxxlr.com/rest.html](https://app.voxxlr.com/rest.html). This repo contains
a small web server in server.js to run a demo locally, but it does not fully implement the required REST Api. 

## Installation

After cloning this repo there are two ways to run the _app_ server on a local machine using docker or nodejs. In either case, is is neccessary that the [_doc_](https://github.com/voxxlr/doc) server is running in order to load Apps. Once the the _app_ server is running point the browser to http://127.0.0.1/launchpad.html. From the you can open the _Editor_ app to access the datasets listed by the _doc_ server

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
