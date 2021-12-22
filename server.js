const fs = require('fs');
const mustache = require("mustache");
const express = require('express')

const hostname = '127.0.0.1';
//const hostname = '0.0.0.0';
const port = 4000;
const app = express()

app.get('(*)/index.html', (req, res, next) => 
{
    fs.readFile(`./${req.path}`, 'utf8', function(err, data) 
    {
        if (!err)
        {
            res.type('html')
            res.send(mustache.render(data, {doc_domain: "http://127.0.0.1:3000", app_endpoint: "", app_source: "" }));
        }
        else
        {
            next(err);
        }
    });
})


app.get('/launchpad.html', (req, res, next) => 
{
    fs.readFile(`./${req.path}`, 'utf8', function(err, data) 
    {
        if (!err)
        {
            res.type('html')
            res.send(mustache.render(data, { doc_domain: "http://127.0.0.1:3000", app_endpoint: "", app_source: "" }));
        }
        else
        {
            next(err);
        }
    });
})

app.use(express.static('.'))

app.listen(port, hostname, () => 
{
    console.log(`---- app server running at http://${hostname}:${port}/launchpad.html --- `);
});

// read command line
var args = process.argv.slice(2);

if (args.length > 0)
{
   
}
