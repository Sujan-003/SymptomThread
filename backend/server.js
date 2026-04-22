const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { connectMongo } = require('./db/mongo');
const { connectArango } = require('./db/arango');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Setup Routes
app.use('/api', apiRoutes);

async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongo();
    
    // Connect to ArangoDB
    await connectArango();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
