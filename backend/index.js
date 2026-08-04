const express = require('express');
require('dotenv').config();

// I-import ang ginawang PostgreSQL connection
const db = require('./config/db');

const app = express();
app.use(express.json());

// Sample route para ma-test kung gumagana ang DB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'Database connected!', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});