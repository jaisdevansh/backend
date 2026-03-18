import { Event } from '../models/Event.js';
import { Booking } from '../models/booking.model.js';

export const getDashboardSummary = async (req, res, next) => {
    const hostId = req.user.id;

    try {
        const events = await Event.find({ hostId }).sort({ createdAt: -1 });
        const bookings = await Booking.find({ hostId });

        const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).slice(0, 5);
        const totalBookings = bookings.length;

        // Calculate actual Capacity Usage
        let totalCapacity = 0;
        let totalSold = 0;

        events.forEach(event => {
            if (event.status !== 'cancelled') {
                event.tickets.forEach(ticket => {
                    totalCapacity += ticket.capacity || 0;
                    totalSold += ticket.sold || 0;
                });
            }
        });

        const capacityUsage = totalCapacity > 0
            ? Math.round((totalSold / totalCapacity) * 100) + '%'
            : '0%';

        const responseData = {
            success: true,
            stats: {
                totalBookings,
                upcomingEventsCount: upcomingEvents.length,
                capacityUsage
            },
            upcomingEvents
        };

        res.status(200).json(responseData);
    } catch (error) {
        next(error);
    }
};
