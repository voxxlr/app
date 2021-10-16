# Voxxlr App SDK
This repository contains the App infrastructure of the [Voxxlr](https://www.voxxlr.com) cloud platform for geospatial content. All files in this repository 
are hosted at voxxlr.github.io/app and the REST Api is hosted and documented at [https://app.voxxlr.com/rest.html](https://app.voxxlr.com/rest.html)

## Installation
Login at [Voxxlr](https://www.voxxlr.com) to upload geospatial datasets and access the Apps in this repository via the launchpad. Develop your own Apps by cloning the [template](https://github.com/voxxlr/template) repository and hosting the files via an accessible url. A new App can then be installed via the launchpad of your Voxxlr account. 


After cloning this repo run 

```javascript
npm install mustache
node server.js 
```
and then point the browser to either of 

```
http://127.0.0.1:3000/cloud
http://127.0.0.1:3000/model
http://127.0.0.1:3000/map
http://127.0.0.1:3000/panorama
```
The datasets displayed are from the sandbox account at voxxlr, but the code producing the visualization is loaded from your local directory. 



## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
The Voxxlr App SDK is licensed under the Affero GPL V3 license.
