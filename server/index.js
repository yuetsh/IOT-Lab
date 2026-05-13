require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/companies', require('./routes/companies'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/checklist-items', require('./routes/checklistItems'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/screenshots', require('./routes/screenshots'));

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// Production: serve React build
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
