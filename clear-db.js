import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const clearUnverified = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await mongoose.connection.collection('users').deleteMany({ emailVerified: false });
        console.log(`Deleted ${result.deletedCount} unverified users!`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

clearUnverified();
