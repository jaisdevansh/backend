import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    type: { type: String, required: true }, // e.g. 'General Access', 'VIP Table'
    price: { type: Number, required: true },
    capacity: { type: Number, required: true },
    sold: { type: Number, default: 0 }
});

const eventSchema = new mongoose.Schema({
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String },
    tickets: [ticketSchema],
    status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' },
    views: { type: Number, default: 0 }
}, { timestamps: true });

// Compound indexes for fast querying
eventSchema.index({ hostId: 1, createdAt: -1 });
eventSchema.index({ hostId: 1, status: 1 });

export const Event = mongoose.model('Event', eventSchema);
