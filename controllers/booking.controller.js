import { Booking } from '../models/booking.model.js';

export const getBookings = async (req, res, next) => {
    try {
        const { eventId, status, search, page = 1, limit = 20 } = req.query;
        let query = { hostId: req.user.id };

        if (eventId) query.eventId = eventId;
        if (status) query.status = status;
        // Search by user name would require aggregation or populate matching. Simplified here:

        const skip = (page - 1) * limit;

        const bookings = await Booking.find(query)
            .populate('userId', 'name email profileImage')
            .populate('eventId', 'title date')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Booking.countDocuments(query);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: Number(page)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const checkInQR = async (req, res, next) => {
    try {
        const { qrPayload, eventId } = req.body;

        const booking = await Booking.findOne({ qrPayload, eventId, hostId: req.user.id });

        if (!booking) {
            return res.status(404).json({ success: false, ticketStatus: "Invalid" });
        }

        if (booking.status === 'checked_in') {
            return res.status(400).json({ success: false, ticketStatus: "Already Used" });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, ticketStatus: "Invalid" });
        }

        booking.status = 'checked_in';
        booking.checkInTime = new Date();
        await booking.save();

        res.status(200).json({ success: true, ticketStatus: "Checked In", bookingId: booking._id });
    } catch (error) {
        next(error);
    }
};
