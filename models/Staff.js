import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['Manager', 'Security', 'Waitstaff', 'Reception'], default: 'Reception' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const Staff = mongoose.model('Staff', staffSchema);
