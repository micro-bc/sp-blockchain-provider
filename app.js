const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');

const app = express();


// Mongoose setup
let mongoUri = 'mongodb+srv://jakob:NMGBxHCiu4C1BvJa@cluster0-vhs1d.mongodb.net/blockchain?retryWrites=true&w=majority';
if (process.env.NODE_ENV == 'production') {
    mongoUri = 'mongodb://localhost/blockchain';
}
mongoose.connect(mongoUri, function (err) {
    if (err) {
        throw err;
    }

    console.log('Successfully connected');
});
mongoose.Promise = global.Promise;

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connecton error: '));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(userRoutes);

app.use(function (req, res, next) {
    return res.status(404).json({
        error: 'Route not found'
    });
});


module.exports = app;
