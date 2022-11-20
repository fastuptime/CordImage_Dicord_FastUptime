const mongoose = require('mongoose');
const config = require('../config.js');
let db = mongoose.createConnection(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true }).addListener('error', (err) => {
    console.log(err);
}).addListener('open', () => {
    console.log('MongoDB connection opened.');
}).addListener('close', () => {
    console.log('MongoDB connection closed.');
});

let imgSchema = new mongoose.Schema({
    url: String,
    ip: String,
    date: String
});

let imgModel = db.model('img', imgSchema);
module.exports = imgModel;