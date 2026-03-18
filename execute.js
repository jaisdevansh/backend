import mongoose from 'mongoose';
import { env } from './config/env.js';

async function test() {
    try {
        await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        console.log("Mongo OK");
    } catch (e) {
        console.log("Mongo FAIL", e.message);
    }
    process.exit();
}
test();
