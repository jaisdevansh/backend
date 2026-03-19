import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stitch_db';

// App initialization is now handled entirely in app.js
// This file can either be removed or kept as a simple entry point if needed by hosting platforms

export default app;

