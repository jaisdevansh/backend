import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stitch_db';

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('✔ MongoDB connected successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Express Backend running at:`);
            console.log(`   - Local:    http://localhost:${PORT}`);
            console.log(`   - Network:  http://192.168.1.4:${PORT}`);
            console.log(`   - API Docs: http://localhost:${PORT}/api-docs (if available)\n`);
        });
    } catch (error) {
        console.error('✘ Failed to connect to MongoDB:', error.message);
        console.log('⚠️  Starting server without database connectivity...');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Express Backend running at http://0.0.0.0:${PORT} (⚠️ NO DB)`);
        });
    }
};

startServer();
