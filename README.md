# Voxxlr App SDK
This repository contains the App infrastructure of the [Voxxlr](https://www.voxxlr.com) cloud platform for geospatial content. All files in this repository 
are hosted at voxxlr.github.io/app and the REST Api is hosted and documented at [https://app.voxxlr.com/rest.html](https://app.voxxlr.com/rest.html). This repo contains
a small web server in server.js to run a demo locally, but it does not fully implement the required REST Api. Note that the demo App still pulls the files from github rather than your local clone. 

## Installation

Running the demo requires that the doc repository has already been cloned and that the server is already running on http://127.0.0.1:3000. Then, after cloning this repo run 

```javascript
npm install mustache
npm install open
node server.js 
```

to open a browser running the editor app using a point cloud loaded from doc.voxxlr.com. Adding an additional command line parameter of either "cloud", "map", "panorama"
or "model" will open a different data type. For example

```javascript
node server.js map
```

In order to open a dataset from a local folder provide a path after the type specifier for example. 

```javascript
node server.js map d:/processor/process
```

The path should point to the */process* directory created by the processing pipeline. 


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
The Voxxlr App SDK is licensed under the Affero GPL V3 license.
