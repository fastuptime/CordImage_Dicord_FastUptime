console.log("FastUptime ByCan");
const { WebhookClient, MessageEmbed } = require('discord.js');
const config = require('./config.js');
const imgUpload = new WebhookClient({ url: config.webhook_uploader });
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');
const moment = require('moment');
const fs = require('fs');

////////////////////////

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'cache/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage });

////////////////////////

app.set('view engine', 'ejs');
app.set('views', './www');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

////////////////////////
const imgModel = require('./mongoDB/img.js');
////////////////////////

app.get('/', (req, res) => {
    res.render('index.ejs',
        {
            config: config
        }
    );
});

app.get('/img/:id', async (req, res) => {
    let id = req.params.id;
    let data = await imgModel.findOne({ _id: id });
    if (data) {
        res.render('response.ejs',
            {
                config: config,
                img: data.url,
                copy: config.domain + 'imgs/' + data._id + '.png'
            }
        );
    } else {
        res.send('Image not found.');
    }
});

app.get("/imgs/:id", async (req, res) => {
    let id = req.params.id;
    id = id.split('.')[0];
    let data = await imgModel.findOne({ _id: id });
    if (data) {
        let url = data.url;
        let filename = url.split('/').pop();
        let file = fs.createWriteStream(`cache/${filename}`);
        let request = require('request');
        request(url).pipe(file).on('close', () => {
            fs.readFile(
                `cache/${filename}`,
                (err, data) => {
                    if (err) {
                        res.send('Error.');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                        res.end(data);
                    }
                }
            );
            setTimeout(() => {
                setTimeout(() => {
                    fs.unlink(`cache/${
                        filename
                    }`, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }, 1000);
                res.sendFile(__dirname + `/cache/${filename}`);
            }, 1000);
        });
    } else {
        res.send('Image not found.');
    }
});

app.post('/upload', upload.single('dosya'), (req, res) => {
    imgUpload.send({ files: [req.file.path] }).then(async (msg) => {
        fs.unlinkSync(req.file.path);
        new imgModel({
            url: msg.attachments[0].url,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            date: moment().format('DD/MM/YYYY HH:mm:ss')
        }).save().then(async (data) => {
            res.render('response.ejs',
                {
                    config: config,
                    img: msg.attachments[0].url,
                    copy: config.domain + 'imgs/' + data._id + '.png'
                }
            );
        }).catch((err) => {
            res.send("Something went wrong! " + err);
        });
    }).catch(err => {
        fs.unlinkSync(req.file.path);
        res.send("Something went wrong! " + err);
    });
});

////////////////////////
app.listen(config.port, () => {
    console.log(`Web server başlatıldı. Port: ${config.port} FastUptime: https://fastuptime.com/`);
});