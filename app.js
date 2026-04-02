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

import { logger } from './logs/logger.js';

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
import notificationRoutes from './routes/notification.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import adminChatRoutes from './routes/adminChat.routes.js';
import adminRoutes from './routes/admin.routes.js';
import drinkRequestRoutes from './routes/drinkRequest.routes.js';
import radarRoutes from './routes/radar.routes.js';
import staffRoutes from './routes/staff.routes.js';
import waiterRoutes from './routes/waiter.routes.js';
import securityRoutes from './routes/security.routes.js';
import floorRoutes from './routes/floor.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import chatRoutes from './routes/chat.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import referralRewardRoutes from './routes/referralReward.routes.js';
import { errorHandler } from './middleware/error.js';


const app = express();

// 0. Trust Proxy (Vital for Railway/Heroku/Nginx)
app.set('trust proxy', 1);

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
app.use('/api/v1/support', aiRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/discovery', discoveryRoutes);
app.use('/admin-chat', adminChatRoutes);
app.use('/admin', adminRoutes);
app.use('/api/v1/drink-requests', drinkRequestRoutes);
app.use('/api/v1/radar', radarRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/waiter', waiterRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/floors', floorRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/analytics', analyticsRoutes);

// New Economics APIs
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/referral', referralRewardRoutes);
app.use('/invite', referralRewardRoutes); // Public Landing Page Route

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
app.use(errorHandler);

// 9. Database Connection & Server Startup
import { initSocket } from './socket.js';
import { initLocationRevealService } from './services/locationReveal.service.js';
import { initIssueEscalationService } from './services/issueEscalation.service.js';

const startServer = async () => {
    try {
        if (!MONGO_URI) {
            logger.error('✘ MONGO_URI is missing. Please check your environment variables.');
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000, 
            socketTimeoutMS: 45000,
            maxPoolSize: 50, // Optimize for Cloud Deployments
        });
        
        logger.info('✔ MongoDB Atlas connected successfully');

        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Server started on port ${PORT} | Environment: ${NODE_ENV}`);
        });

        // Optimize TCP connections for high-performance keep-alive and cloud load balancers
        server.keepAliveTimeout = 65000; 
        server.headersTimeout = 66000;

        initSocket(server);
        logger.info('🔌 Socket.io Layer initialized successfully');
        
        // Start Background Jobs
        initLocationRevealService();
        initIssueEscalationService();
    } catch (error) {
        logger.error(`✘ Failed to connect to MongoDB: ${error.message}`);
        // Fail gracefully for Cloud deployment requirements
        process.exit(1);
    }
};

startServer();

export default app;


