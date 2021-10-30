const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const mustache = require("mustache");
const open = require('open')

const hostname = '127.0.0.1';
const port = 4000;

tokens = {
    
    "cloud"   :"7pWwjmIHiTFPi9CZ30hq4Q==.eyJpIjoxNjA4MzgyOTQzMTA2LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjEsInYiOjN9",
    "model"   :"pIESgTg7brWgeTKRJnCdUw==.eyJpIjoxNjAyNDQxNzA2Nzg0LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjQsInYiOjN9",
    "map"     :"KyaQEEGWQ46UCJqyrBH8jA==.eyJpIjoxNjEwMzIxOTQ4OTYxLCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjIsInYiOjJ9",
    "panorama":"wit16DsjbMM4hbxdWWgkcw==.eyJpIjoxNjA3OTc1NDAyMzI2LCJwIjoiUiIsIm0iOjE2MzQzMDEzODAsInQiOjMsInYiOjF9"
}


const server = http.createServer(async (req, res) => 
{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    try 
    {
        let request = url.parse(req.url,true);
    
        if (request.query.token)
        {
            fs.readFile(`.${request.pathname}`, 'utf8', function(err, data) 
            {
                res.end(mustache.render(data,{ token: encodeURIComponent(request.query.token), domain: "http://127.0.0.1:3000" }));
            });
        }		
        else
        {
            switch (request.pathname)
            {
                case "/list":
                    datasets = { 
                        content: [
                            {
                                id: "0",
                                meta: { 
                                    name: "model"
                                },
                                token: JSON.stringify({ type: "model", token: tokens["model"] })
                            },
                            {
                                id: "1",
                                meta: { 
                                    name: "map"
                                },
                                token: JSON.stringify({ type: "map", token: tokens["map"] })
                            },
                            {
                                id: "2",
                                meta: { 
                                    name: "panorama"
                                },
                                token: JSON.stringify({ type: "panorama", token: tokens["panorama"] })
                            },
                            {
                                id: "3",
                                meta: { 
                                    name: "cloud"
                                },
                                token: JSON.stringify({ type: "cloud", token: tokens["cloud"] })
                            }
                        ]
                    }
                res.end(JSON.stringify(datasets));
                break;
            default:
                console.log("unimplemented " + request.pathname)
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
    console.log(`\n\n`);
    console.log(`---- starting demo App server --- `);
    console.log(`---- `);
    console.log(`---- usage: node server.js type path `);
    console.log(`---- `);
    console.log(`---- type in ['cloud','map','model','panorama']`);
    console.log(`---- path is either empty or path to locally processed dataset i.e ..../processor/process"`);
    console.log(`---- `);
    console.log(`---- Voxxlr demo App server --- `);
    console.log(`\n\n`);
});



// read command line
var args = process.argv.slice(2);

let source = {};

if (args.length > 0)
{
    source.type = args[0]
}
else
{
    source.type = "cloud";
}

if (args.length > 1)
{
    source.path = args[1]
}
else
{
    source.token = tokens[source.type] 
}

// open browser
open(`http://${hostname}:${port}/voxxlr/editor/index.html?token=${encodeURIComponent(JSON.stringify(source))}`);

