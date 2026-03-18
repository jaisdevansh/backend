import mongoose from 'mongoose';
import { Venue } from './models/Venue.js';
import { Event } from './models/Event.js';
import dotenv from 'dotenv';

dotenv.config();

const makeActive = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stitch');
        console.log('Connected to DB');

        await Venue.updateMany({}, { status: 'active' });
        console.log('All venues marked as active!');

        await Event.updateMany({}, { status: 'published' });
        console.log('All events marked as published!');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

makeActive();
