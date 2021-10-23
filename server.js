const http = require('http');
const https = require('https');
const fs = require('fs');
const sys = require('sys');
const mustache = require("mustache");

const hostname = '127.0.0.1';
const port = 3000;

tokens = {
    
    cloud   :"7pWwjmIHiTFPi9CZ30hq4Q==.eyJpIjoxNjA4MzgyOTQzMTA2LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjEsInYiOjN9",
    model   :"pIESgTg7brWgeTKRJnCdUw==.eyJpIjoxNjAyNDQxNzA2Nzg0LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjQsInYiOjN9",
    map     :"KyaQEEGWQ46UCJqyrBH8jA==.eyJpIjoxNjEwMzIxOTQ4OTYxLCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjIsInYiOjJ9",
    panorama:"wit16DsjbMM4hbxdWWgkcw==.eyJpIjoxNjA3OTc1NDAyMzI2LCJwIjoiUiIsIm0iOjE2MzQzMDEzODAsInQiOjMsInYiOjF9"

}


const server = http.createServer(async (req, res) => 
{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    try 
    {
        let token;
         
        switch (req.url) 
        {
            case "/model":
                token = tokens["model"];
                break;
            case "/map":
                token = tokens["map"];
                break;
            case "/panorama":
                token = tokens["panorama"];
                break;
            case "/cloud":
                token = tokens["cloud"];
                break;
            default:
                file = `.${req.url}`
                break;
        }

        if (token)
        {
            let file = './voxxlr/editor/index.html';
            fs.readFile(file, 'utf8', function(err, data) 
            {
                res.end(mustache.render(data,{ token }));
            });
        }		
        else
        {
            switch (req.url)
            {
                case "/list":
                    datasets ={ 
                        content: [
                            {
                                id: "0",
                                meta: { 
                                    name: "model"
                                },
                                token: tokens["model"]
                            },
                            {
                                id: "1",
                                meta: { 
                                    name: "map"
                                },
                                token: tokens["map"]
                            },
                            {
                                id: "2",
                                meta: { 
                                    name: "panorama"
                                },
                                token: tokens["panorama"]
                            },
                            {
                                id: "3",
                                meta: { 
                                    name: "cloud"
                                },
                                token: tokens["cloud"]
                            }
                        ]
                    }
                res.end(JSON.stringify(datasets));
                break;
            default:
                console.log("unimplemented " + req.url)
                break;

            }
        }
    }
    catch (error)
    {
        console.error(error)
        res.end("<html><body>Unable to reach doc.voxxlr.com to load sample dataset</body></html>");
    }
});

server.listen(port, hostname, () => 
{
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log(`For examples of different data types point your browser to either of :`);
    console.log(`http://${hostname}:${port}/cloud`);
    console.log(`http://${hostname}:${port}/model`);
    console.log(`http://${hostname}:${port}/map`);
    console.log(`http://${hostname}:${port}/panorama`);
});