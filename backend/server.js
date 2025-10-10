require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/google-auth');
const organizationRoutes = require('./routes/organizations');
const leadRoutes = require('./routes/leads');
const listingRoutes = require('./routes/listings');
const taskRoutes = require('./routes/tasks');
const artifactRoutes = require('./routes/artifacts');
const interactionRoutes = require('./routes/interactions');
const photoRoutes = require('./routes/photos');
const agentRoutes = require('./routes/agents');
const messengerRoutes = require('./routes/messenger');
const insightsRoutes = require('./routes/insights');
const storageRoutes = require('./routes/storage');
const aiRoutes = require('./routes/ai');
const { initMinio } = require('./init-minio');

const app = express();

const normalizeOrigin = (origin) => {
  if (!origin || typeof origin !== 'string') return null;
  return origin.trim().replace(/\/$/, '');
};

const defaultOrigins = [
  'https://majicagent.com',
  'https://www.majicagent.com',
  'http://localhost:4004',
  'http://localhost:5173',
  'http://192.168.69.106:4004'
];

const envOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : []
].flat();

const allowedOrigins = new Set(
  [...defaultOrigins, ...envOrigins]
    .map(normalizeOrigin)
    .filter(Boolean)
);

app.disable('x-powered-by');
app.set('etag', false);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.has(normalizedOrigin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'replace-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

initMinio().catch((err) => console.error('MinIO initialization error:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/messenger', messengerRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/ai', aiRoutes);

if (process.env.SERVE_LEGACY_FRONTEND === 'true') {
  app.use(express.static(path.join(__dirname, 'frontend')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  });
}

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
