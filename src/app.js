const express = require('express');
const path = require('path');
const electionRoutes = require('./routes/electionRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', electionRoutes);

module.exports = app;
