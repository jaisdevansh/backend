import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    venueType: { type: String, default: 'Nightclub' },
    description: { type: String },
    address: { type: String, required: true },
    capacity: { type: Number, required: true, default: 0 },
    openingTime: { type: String, default: '10:00 PM' },
    closingTime: { type: String, default: '04:00 AM' },
    rules: { type: String },
    heroImage: { type: String },
    images: [{ type: String }],
    amenities: [{ type: String }],
    menu: [{
        name: { type: String, required: true },
        type: { type: String, required: true }, // e.g., 'Cocktail', 'Mocktail', 'Dish'
        description: { type: String },
        image: { type: String }
    }],
    status: { type: String, enum: ['active', 'pending_verification'], default: 'pending_verification' }
}, { timestamps: true });

export const Venue = mongoose.model('Venue', venueSchema);
