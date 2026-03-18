import mongoose from 'mongoose';
import { User } from './models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const upgradeAllUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stitch');
        console.log('Connected to DB');

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        await User.updateMany({}, {
            $set: {
                'membership.tier': 'Black',
                'membership.status': 'active',
                'membership.expiryDate': expiryDate
            }
        });

        console.log('All users upgraded to Black tier!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

upgradeAllUsers();
