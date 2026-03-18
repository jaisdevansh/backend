import mongoose from 'mongoose';
import { User } from './models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const makeHost = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stitch');
        console.log('Connected to DB');

        const user = await User.findOneAndUpdate(
            { email: email },
            {
                role: 'host',
                emailVerified: true
            },
            { new: true }
        );

        if (user) {
            console.log(`Success! ${email} is now a HOST.`);
        } else {
            console.log('User not found. Check the email.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// Replace with your logged-in email
const emailToPromote = process.argv[2];
if (!emailToPromote) {
    console.log('Usage: node makeHost.js your-email@example.com');
    process.exit(1);
}

makeHost(emailToPromote);
