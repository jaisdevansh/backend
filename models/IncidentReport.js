import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null },
    incidentType: { 
        type: String, 
        enum: ['harassment', 'lost_item', 'safety_concern', 'billing_issue', 'other'], 
        required: true 
    },
    description: { type: String, required: true, maxlength: 1000 },
    evidenceImages: [{ type: String }], // Optional URLs for uploaded evidence
    status: { type: String, enum: ['pending', 'investigating', 'resolved'], default: 'pending' }
}, { timestamps: true });

export const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema);
