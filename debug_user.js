import mongoose from 'mongoose';
import { User } from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stitch_user_db';

async function check() {
    await mongoose.connect(MONGO_URI);
    const users = await User.find({}).select('email role name');
    console.log('--- ALL USERS ---');
    console.log(users);
    process.exit();
}

check();
