const express = require('express');
const app = express();
const serverRoutes = require('./routes/serverRoutes');

app.use(express.json());
app.use('/api', serverRoutes);

module.exports = app;