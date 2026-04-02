import express from 'express';
import cors from 'cors';

import { connectToDatabase } from './src/config/db.js';
import { env } from './src/config/env.js';
import clinicStateRoutes from './src/routes/clinicStateRoutes.js';
import pdfRoutes from './src/routes/pdfRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health route
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'clinicppm-mongo-api',
    message: 'MongoDB API is running.'
  });
});

// Routes
app.use('/api', clinicStateRoutes);
app.use('/api/pdf', pdfRoutes);

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[api] Unhandled error:', err);
  res.status(500).json({
    ok: false,
    message: err.message || 'Unexpected server error.'
  });
});

// Start server
const startServer = async () => {
  const maxRetries = 5;
  let attempt = 0;
  let dbConnected = false;
  while (attempt < maxRetries && !dbConnected) {
    try {
      await connectToDatabase();
      console.log(`[api] Database connected (attempt ${attempt + 1})`);
      dbConnected = true;
    } catch (error) {
      attempt++;
      console.error(`[api] DB connection failed (attempt ${attempt}):`, error.message);
      if (attempt < maxRetries) {
        console.log('[api] Retrying DB connection in 3 seconds...');
        await new Promise(res => setTimeout(res, 3000));
      }
    }
  }
  if (!dbConnected) {
    console.error(`[api] Could not connect to MongoDB after ${maxRetries} attempts. Exiting.`);
    process.exit(1);
  }

  const port = process.env.PORT || env.port || 4000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[api] Server running on port ${port}`);
  });
};

startServer();