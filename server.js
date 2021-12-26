const fs = require('fs');
const mustache = require("mustache");
const express = require('express')


var args = process.argv.slice(2);

if (args.length > 0)
{
    host = args[0]
}
else
{
    host = '127.0.0.1';
}

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

app.listen(port, host, () => 
{
    console.log(`---- app server running at http://${host}:${port}/launchpad.html --- `);
});
