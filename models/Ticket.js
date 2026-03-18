import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    category: {
        type: String,
        enum: ['Payment', 'Technical', 'Account', 'Event Issue', 'Other'],
        default: 'Other'
    }
}, { timestamps: true });

export const Ticket = mongoose.model('Ticket', ticketSchema);
