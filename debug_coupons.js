import mongoose from 'mongoose';
import { Coupon } from './models/Coupon.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stitch_user_db';

async function check() {
    await mongoose.connect(MONGO_URI);
    const coupons = await Coupon.find({});
    console.log('--- ALL COUPONS ---');
    console.log(coupons);
    process.exit();
}

check();
