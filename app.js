import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import hostRoutes from './routes/host.routes.js';
import supportRoutes from './routes/support.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Security Middlewares
app.use(helmet());

// Rate Limiting (Increased for development)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Core Middlewares
app.use(cors({ origin: true, credentials: true })); // Allow cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Global Debug Logger for all requests
app.use((req, res, next) => {
    console.log(`\n======================================================`);
    console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length > 0) {
        const bodyToLog = { ...req.body };
        if (bodyToLog.profileImage && bodyToLog.profileImage.length > 100) {
            bodyToLog.profileImage = bodyToLog.profileImage.substring(0, 50) + '... [TRUNCATED BASE64]';
        }
        console.log(`Body:`, JSON.stringify(bodyToLog, null, 2));
    }
    if (Object.keys(req.query).length > 0) {
        console.log(`Query:`, JSON.stringify(req.query, null, 2));
    }
    console.log(`======================================================\n`);
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/host', hostRoutes);
app.use('/support', supportRoutes);
app.use('/ai', aiRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running', data: {} });
});

// Unknown Routes handling
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found', data: {} });
});

// Global Error Handling
app.use(errorHandler);

export default app;
