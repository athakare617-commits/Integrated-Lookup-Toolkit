import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import healthRoutes from './routes/healthRoutes.js';
import dnsRoutes from './routes/dnsRoutes.js';
import ipRoutes from './routes/ipRoutes.js';
import reverseDnsRoutes from './routes/reverseDnsRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import whoisRoutes from './routes/whoisRoutes.js';
import nameRoutes from './routes/nameRoutes.js';
import integratedRoutes from './routes/integratedRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import accuracyRoutes from './routes/accuracyRoutes.js';

import { lookupLimiter, statsLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback to current working directory .env

// Global process error guards
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Configure CORS for local development and Vercel deployments
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, serverless rewrites, curl)
    // or matching configured client origin, localhost, or any vercel.app preview domain
    if (
      !origin ||
      origin === CLIENT_ORIGIN ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('https://localhost:') ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      // In production, allow all origins or configured origin
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString().substring(11, 19)}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root API information route
app.get('/api', (req, res) => {
  res.json({
    project: 'Integrated Lookup Toolkit API',
    subtitle: 'Name, Email, IP, Domain/DNS & More',
    tagline: 'Multiple Lookups. One Toolkit.',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: 'GET /api/health',
      integrated: 'POST /api/integrated-lookup',
      dns: 'GET /api/dns?domain=example.com',
      ip: 'GET /api/ip?ip=8.8.8.8',
      reverseDns: 'GET /api/reverse-dns?ip=8.8.8.8',
      email: 'GET /api/email?email=user@example.com',
      whois: 'GET /api/whois?domain=example.com',
      name: 'GET /api/name?name=John%20Smith',
      scan: 'POST /api/scan (Universal Threat Scan with VirusTotal)',
      scanIp: 'GET /api/scan/ip?ip=8.8.8.8',
      scanDomain: 'GET /api/scan/domain?domain=example.com',
      scanUrl: 'GET /api/scan/url?url=https://example.com',
      scanHash: 'GET /api/scan/hash?hash=eicar_hash',
      scanStatus: 'GET /api/scan/status',
      history: 'GET /api/history',
      stats: 'GET /api/stats',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      authResetPassword: 'POST /api/auth/reset-password'
    }
  });
});

// Rate limiting on lookups
app.use('/api/dns', lookupLimiter, dnsRoutes);
app.use('/api/ip', lookupLimiter, ipRoutes);
app.use('/api/reverse-dns', lookupLimiter, reverseDnsRoutes);
app.use('/api/email', lookupLimiter, emailRoutes);
app.use('/api/whois', lookupLimiter, whoisRoutes);
app.use('/api/name', lookupLimiter, nameRoutes);
app.use('/api/integrated-lookup', lookupLimiter, integratedRoutes);
app.use('/api/scan', lookupLimiter, scanRoutes);
app.use('/api/auth', authRoutes);

// Health, accuracy verification & history
app.use('/api', healthRoutes);
app.use('/api/accuracy', accuracyRoutes);
app.use('/api', statsLimiter, historyRoutes);

// 404 & Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
