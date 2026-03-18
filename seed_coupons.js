import mongoose from 'mongoose';
import { Coupon } from './models/Coupon.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stitch_user_db';
const HOST_ID = '699ad10760b9bc6cd5abc0bc';

async function seed() {
    await mongoose.connect(MONGO_URI);

    // Clear existing
    await Coupon.deleteMany({ hostId: HOST_ID });

    const coupons = [
        {
            hostId: HOST_ID,
            code: 'STITCH50',
            discountType: 'percentage',
            discountValue: 50,
            usageLimit: 100,
            expiryDate: new Date('2026-12-31'),
            isActive: true
        },
        {
            hostId: HOST_ID,
            code: 'WELCOME2026',
            discountType: 'flat',
            discountValue: 1000,
            usageLimit: 50,
            expiryDate: new Date('2026-06-30'),
            isActive: true
        }
    ];

    await Coupon.insertMany(coupons);
    console.log('--- Real coupons seeded ---');
    process.exit();
}

seed();
