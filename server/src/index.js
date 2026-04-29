import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import ceoRoutes from './routes/ceo.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim());

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Keep API data responses consistent while leaving auth token responses raw.
app.use('/api', (req, res, next) => {
  const json = res.json.bind(res);

  res.json = (body) => {
    if (
      req.path.startsWith('/auth') ||
      req.path === '/health' ||
      req.originalUrl === '/api/health' ||
      body?.success !== undefined ||
      body?.token
    ) {
      return json(body);
    }

    if (body?.error) {
      return json({ success: false, error: body.error });
    }

    return json({ success: true, data: body });
  };

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ceo', ceoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
