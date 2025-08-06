const express = require('express');
const cors = require('cors');
const serverRoutes = require('./routes/serverRoutes');
const initializeDatabase = require('./db/init');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', serverRoutes);

//Initialize Dabatase Tables
initializeDatabase();

app.listen(port, () => {
    console.log(`Service Status Dashboard API running at http://localhost:${port}`);
});

module.exports = app;