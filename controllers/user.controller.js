import { User } from '../models/user.model.js';
import { Booking } from '../models/booking.model.js';
import { Event } from '../models/Event.js';
import { Venue } from '../models/Venue.js';
import { updateProfileSchema, changePasswordSchema, createBookingSchema, updateMembershipSchema, bookEventSchema } from '../validators/user.validator.js';
import bcrypt from 'bcrypt';

export const getProfile = async (req, res, next) => {
    try {
        console.time(`getProfile-${req.user.id}`);
        const user = await User.findById(req.user.id).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found', data: {} });
        }
        console.timeEnd(`getProfile-${req.user.id}`);
        res.status(200).json({ success: true, message: 'Profile fetched', data: user });
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message, data: {} });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    ...(value.name && { name: value.name }),
                    ...(value.phone && { phone: value.phone }),
                    ...(value.profileImage && { profileImage: value.profileImage })
                }
            },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        res.status(200).json({ success: true, message: 'Profile updated', data: updatedUser });
    } catch (err) {
        next(err);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message, data: {} });
        }

        const user = await User.findById(req.user.id);
        if (!user || !(await user.comparePassword(value.oldPassword))) {
            return res.status(400).json({ success: false, message: 'Incorrect old password', data: {} });
        }

        user.password = value.newPassword;
        user.refreshToken = null;
        await user.save();

        res.clearCookie('accessToken');

        res.status(200).json({ success: true, message: 'Password updated successfully. Please login again.', data: {} });
    } catch (err) {
        next(err);
    }
};

export const updateMembership = async (req, res, next) => {
    try {
        const { error, value } = updateMembershipSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message, data: {} });
        }

        // Set expiry to 1 month from now
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    membership: {
                        tier: value.tier,
                        status: 'active',
                        expiryDate
                    }
                }
            },
            { new: true }
        ).select('-password -refreshToken');

        res.status(200).json({
            success: true,
            message: `Successfully upgraded to ${value.tier} Membership`,
            data: updatedUser
        });
    } catch (err) {
        next(err);
    }
};

// Booking Logic
export const createBooking = async (req, res, next) => {
    try {
        const { error, value } = createBookingSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message, data: {} });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            hostId: value.hostId,
            serviceId: value.serviceId,
            ticketType: value.ticketType || 'Reservation',
            pricePaid: value.pricePaid || 0,
            status: 'completed',
            paymentStatus: 'paid'
        });

        res.status(201).json({ success: true, message: 'Booking created successfully', data: booking });
    } catch (err) {
        next(err);
    }
};

export const getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate('hostId', 'name email profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: 'Bookings fetched', data: bookings });
    } catch (err) {
        next(err);
    }
};

export const getAllEvents = async (req, res, next) => {
    try {
        const events = await Event.find()
            .populate('hostId', 'name profileImage venueProfile._id') // populate host details if needed
            .sort({ date: 1 });

        res.status(200).json({ success: true, message: 'Events fetched', data: events });
    } catch (err) {
        next(err);
    }
};

export const getAllVenues = async (req, res, next) => {
    try {
        const venues = await Venue.find()
            .populate('hostId', 'name profileImage') // populate host details 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: 'Venues fetched', data: venues });
    } catch (err) {
        next(err);
    }
};

export const bookEvent = async (req, res, next) => {
    try {
        const { error, value } = bookEventSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message, data: {} });
        }

        const event = await Event.findById(value.eventId);
        if (!event || event.status !== 'published') {
            return res.status(404).json({ success: false, message: 'Event not found or not currently available', data: {} });
        }

        const ticket = event.tickets.find(t => t.type === value.ticketType);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket type not found for this event', data: {} });
        }

        if (ticket.sold >= ticket.capacity) {
            return res.status(400).json({ success: false, message: 'Tickets for this type are sold out', data: {} });
        }

        // Logic to check membership tier if booking VIP Table
        if (ticket.type.toLowerCase().includes('vip')) {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found', data: {} });
            }
            if (user.membership.tier !== 'Gold' && user.membership.tier !== 'Black') {
                return res.status(403).json({
                    success: false,
                    message: `VIP Access Restricted. Your current tier is ${user.membership.tier}. Upgrade to Gold or Black to book VIP Tables.`,
                    data: {}
                });
            }
            if (user.membership.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Your membership is not active. Please renew to book VIP Tables.',
                    data: {}
                });
            }
        }

        // Increment sold count
        ticket.sold += 1;
        await event.save();

        const booking = await Booking.create({
            userId: req.user.id,
            hostId: event.hostId,
            eventId: event._id,
            serviceId: event._id, // Service ID for backwards compatibility
            ticketType: ticket.type,
            tableId: value.tableId || null,
            pricePaid: ticket.price,
            status: 'pending',     // User has requested it
            paymentStatus: 'paid'  // Emulating successful payment
        });

        res.status(201).json({ success: true, message: 'Successfully booked experience', data: booking });
    } catch (err) {
        next(err);
    }
};

export const getBookedTables = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const bookings = await Booking.find({
            eventId,
            status: { $in: ['pending', 'approved', 'active'] },
            tableId: { $exists: true, $ne: null }
        }).select('tableId');

        const bookedTableIds = bookings.map(b => b.tableId);

        res.status(200).json({ success: true, message: 'Booked tables fetched', data: bookedTableIds });
    } catch (err) {
        next(err);
    }
};
