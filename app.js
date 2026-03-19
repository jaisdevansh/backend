import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load Environment Variables
dotenv.config();

// Basic Error Check for Vital Variables if in Production
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// Import Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import hostRoutes from './routes/host.routes.js';
import supportRoutes from './routes/support.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({ origin: "*" })); // Fix for frontend connection


// 2. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// 3. Core Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// 4. Logging (Optimized for Production)
if (NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// 5. Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/host', hostRoutes);
app.use('/support', supportRoutes);
app.use('/ai', aiRoutes);

// 6. Health Check (Crucial for Cloud Deployment)
app.get('/', (req, res) => {
    res.json({ status: 'active', environment: NODE_ENV, message: 'Stitch API Server Running' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ success: true, timestamp: new Date().toISOString() });
});

// 7. Unknown Routes Handling
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

// 8. Global Error Handler Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error for debugging in non-production
    if (NODE_ENV !== 'production') {
        console.error(`[ERROR] ${err.stack}`);
    } else {
        console.error(`[ERROR] ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        message: NODE_ENV === 'production' ? message : err.stack,
        data: {}
    });
});

// 9. Database Connection & Server Startup
const startServer = async () => {
    try {
        if (!MONGO_URI) {
            console.error('✘ MONGO_URI is missing. Please check your environment variables.');
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000, 
            socketTimeoutMS: 45000,
            maxPoolSize: 50, // Optimize for Cloud Deployments
        });
        
        console.log('✔ MongoDB Atlas connected successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server started on port ${PORT}`);
            console.log(`🌍 Environment: ${NODE_ENV}`);
        });
    } catch (error) {
        console.error('✘ Failed to connect to MongoDB:', error.message);
        // Fail gracefully for Cloud deployment requirements
        process.exit(1);
    }
};

startServer();

export default app;


