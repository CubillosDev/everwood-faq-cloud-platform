const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const uploadRoutes = require('./routes/uploadRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const faqRoutes = require('./routes/faqRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'Everwood FAQ Cloud' });
});

// Rutas
app.use('/api/upload', uploadRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/faqs', faqRoutes);

// Manejo global de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
