const app = require('express')();
const bodyparser = require('body-parser');
const config = require('./config')
const fileHandler = require('./filehandler');
const fs = require('fs');
const { promisify } = require('util');
const { default: Axios } = require('axios');
const parse = require('url').parse
const types = config.types
const rootFolder = config.rootFolder
const defaultIndex = config.defaultIndex

const read = promisify(fs.readFile)

module.exports = server = app;

app.use(bodyparser.json());

app.get('/', function (req, res) {
    if (!req.query.token)
        res.status(400).json({ status: 400, message: 'Query param user_id si required' });
    else {
        var filename = defaultIndex;

        fullPath = rootFolder + filename;
        extension = filename.substr(filename.lastIndexOf('.') + 1);
        
        fileHandler(fullPath, function (data) {
            res.writeHead(200, {
                'Content-Type': types[extension] || 'text/plain',
                'Content-Length': data.length
            });
            res.end(data);
        }, function (err) {
            res.writeHead(404);
            res.end();
        });
    }
});

app.post('/currentPurchases', async function (req, res) {
    const filename = defaultIndex;
    fullPath = rootFolder + filename;
    extension = filename.substr(filename.lastIndexOf('.') + 1);
    console.log(req.body);
    await read('purchases.json', 'utf-8')
        .then(result => {
            const db = JSON.parse(result);
            const index = db.findIndex(item => item.id === req.body.id);
            if (index == -1) {
                db.push({
                    id: req.body.id,
                    purchase: {
                        email: req.body.purchase.email,
                        cpf_payer: req.body.purchase.cpf_payer,
                        tickets: req.body.purchase.tickets,
                    }
                });
            }
            else {
                db.splice(index, 1);
                db.push({
                    id: req.body.id,
                    purchase: {
                        email: req.body.purchase.email,
                        cpf_payer: req.body.purchase.cpf_payer,
                        tickets: req.body.purchase.tickets,
                    }
                });
            }

            fs.writeFileSync('purchases.json', JSON.stringify(db));
        })
        .catch(err => console.log(err));

    fileHandler(fullPath, function (data) {
        res.writeHead(200, {
            'Content-Type': types[extension] || 'text/plain',
            'Content-Length': data.length
        });
        res.end(data);

    }, function (err) {
        res.writeHead(404);
        res.end();
    });
});

app.get('/currentPurchases', function (req, res) {

    Axios.get('https://lum-rest.herokuapp.com/profile', { headers: { 'x-access-token': `Bearer ${req.query.token}` } })
        .then(user => {
            read('purchases.json', 'utf-8')
                .then(result => {                    
                    const db = JSON.parse(result);
                    const index = db.findIndex(item => item.id === Number(user.data.id));

                    if (index == -1) {
                        res.status(404).json({ status: 404, message: "This purchase don't is current" })
                    } else {
                        res.status(200).json(db[index]);
                    }
                })
                .catch(err => console.log(err));
        })
        .catch(err => {
            res.writeHead(403);
            res.end();
        })
})

app.get('/file', function (req, res) {
    var filename = parse(req.query.path).pathname,
        fullPath,
        extension;

    fullPath = rootFolder + filename;
    extension = filename.substr(filename.lastIndexOf('.') + 1);

    fileHandler(fullPath, function (data) {
        res.writeHead(200, {
            'Content-Type': types[extension] || 'text/plain',
            'Content-Length': data.length
        });
        res.end(data);

    }, function (err) {
        res.writeHead(404);
        res.end();
    });
})