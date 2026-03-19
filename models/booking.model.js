import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId }, // E.g., Event or Service Listing

    // Event specific fields
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    ticketType: { type: String },
    tableId: { type: String },
    pricePaid: { type: Number },
    qrPayload: { type: String, sparse: true },
    checkInTime: { type: Date },

    status: { type: String, enum: ['pending', 'approved', 'rejected', 'active', 'checked_in', 'cancelled', 'invalid'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }
}, { timestamps: true });

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hostId: 1, createdAt: -1 });
bookingSchema.index({ eventId: 1, status: 1 });
bookingSchema.index({ eventId: 1, tableId: 1 });


export const Booking = mongoose.model('Booking', bookingSchema);
