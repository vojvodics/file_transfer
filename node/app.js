const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
// config file
const config = require('./config');
const router = require('./routes');


mongoose.Promise = global.Promise;
mongoose.connect(config.DB_URI, {useMongoClient: true})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err))


// set up the server
const server = app.listen(config.port, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log(`Listening at: http://${host}:${port}`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));


app.use('/', router);

