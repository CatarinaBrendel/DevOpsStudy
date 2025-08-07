const express = require('express');
const app = express();
const serverRoutes = require('./routes/serverRoutes');
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', serverRoutes);



module.exports = app;