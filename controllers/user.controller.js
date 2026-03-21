import { User } from '../models/user.model.js';
import { Booking } from '../models/booking.model.js';
import { Event } from '../models/Event.js';
import { Venue } from '../models/Venue.js';
import { updateProfileSchema, changePasswordSchema, createBookingSchema, updateMembershipSchema, bookEventSchema } from '../validators/user.validator.js';
import bcrypt from 'bcryptjs';
import NodeCache from 'node-cache';

const myCache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds


export const getProfile = async (req, res, next) => {
    try {
        console.time(`getProfile-${req.user.id}`);
        const user = await User.findById(req.user.id).select('-password -refreshToken').lean();
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
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, message: 'Bookings fetched', data: bookings });

    } catch (err) {
        next(err);
    }
};

export const getAllEvents = async (req, res, next) => {
    try {
        const cachedEvents = myCache.get('all_events');
        if (cachedEvents) {
            return res.status(200).json({ success: true, message: 'Events fetched (cached)', data: cachedEvents });
        }

        const events = await Event.find({ status: 'published' }) // Only fetch published events
            .populate('hostId', 'name profileImage venueProfile._id')
            .sort({ date: 1 })
            .lean();

        myCache.set('all_events', events);

        res.status(200).json({ success: true, message: 'Events fetched', data: events });
    } catch (err) {
        next(err);
    }
};

export const getAllVenues = async (req, res, next) => {
    try {
        const cachedVenues = myCache.get('all_venues');
        if (cachedVenues) {
            return res.status(200).json({ success: true, message: 'Venues fetched (cached)', data: cachedVenues });
        }

        const venues = await Venue.find({ status: 'active' }) // Only fetch active venues
            .populate('hostId', 'name profileImage')
            .sort({ createdAt: -1 })
            .lean();

        myCache.set('all_venues', venues);

        res.status(200).json({ success: true, message: 'Venues fetched', data: venues });
    } catch (err) {
        next(err);
    }
};

export const getEventById = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('hostId', 'name profileImage venueProfile._id')
            .lean();
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        res.status(200).json({ success: true, data: event });
    } catch (err) {
        next(err);
    }
};

export const getVenueById = async (req, res, next) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('hostId', 'name profileImage')
            .lean();
        if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });

        res.status(200).json({ success: true, data: venue });
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
        }).select('tableId').lean();

        const bookedTableIds = bookings.map(b => b.tableId);

        res.status(200).json({ success: true, message: 'Booked tables fetched', data: bookedTableIds });
    } catch (err) {
        next(err);
    }
};

// Rating
export const submitAppRating = async (req, res, next) => {
    try {
        const { stars, feedback } = req.body;
        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ success: false, message: 'Invalid star rating format' });
        }
        const { AppRating } = await import('../models/AppRating.js');
        const rating = await AppRating.create({
            userId: req.user.id,
            stars,
            feedback
        });
        res.status(201).json({ success: true, message: 'Thank you for your feedback!' });
    } catch (err) {
        next(err);
    }
};

// Referral System
export const getReferralData = async (req, res, next) => {
    try {
        let user = await User.findById(req.user.id).select('referralCode loyaltyPoints referralsCount');
        if (!user.referralCode) {
            user.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase() + user._id.toString().substring(18, 22).toUpperCase();
            await user.save();
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

export const applyReferralCode = async (req, res, next) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Please provide a valid code' });

        const user = await User.findById(req.user.id);
        if (user.referredBy) {
            return res.status(400).json({ success: false, message: 'You have already used a referral code.' });
        }
        if (user.referralCode === code) {
            return res.status(400).json({ success: false, message: 'You cannot use your own referral code.' });
        }

        const referrer = await User.findOne({ referralCode: code });
        if (!referrer) {
            return res.status(404).json({ success: false, message: 'Invalid referral code.' });
        }

        user.referredBy = referrer._id;
        user.loyaltyPoints += 50; 
        await user.save();

        referrer.referralsCount += 1;
        referrer.loyaltyPoints += 100;
        await referrer.save();

        res.status(200).json({ success: true, message: 'Code applied! You earned 50 points.', data: user });
    } catch (err) {
        next(err);
    }
};

// Split Payments
export const sendSplitRequest = async (req, res, next) => {
    try {
        const { targetUserPhone, amount, purpose } = req.body;
        if (!targetUserPhone || !amount) {
            return res.status(400).json({ success: false, message: 'Target user and amount required to split.' });
        }
        // In a real app we would create a SplitRequest model
        res.status(200).json({ success: true, message: 'Split request sent successfully!' });
    } catch (err) {
        next(err);
    }
};

export const getSplitRequests = async (req, res, next) => {
    try {
        // Return dummy pending split requests mocking actual data
        const dummySplits = [
            { id: '1', requester: 'Alex', amount: 450, purpose: 'VIP Table at Neon', status: 'pending', date: new Date() }
        ];
        res.status(200).json({ success: true, data: dummySplits });
    } catch (err) {
        next(err);
    }
};

export const respondSplitRequest = async (req, res, next) => {
    try {
        const { requestId, action } = req.body; 
        if (!action) return res.status(400).json({ success: false, message: 'Action missing' });
        res.status(200).json({ success: true, message: `Split request ${action}ed successfully.` });
    } catch (err) {
        next(err);
    }
};

export const submitIncidentReport = async (req, res, next) => {
    try {
        const { incidentType, description, venueId, evidenceImages } = req.body;
        
        if (!incidentType || !description) {
            return res.status(400).json({ success: false, message: 'Incident type and description are required' });
        }
        
        const { IncidentReport } = await import('../models/IncidentReport.js');
        const report = await IncidentReport.create({
            userId: req.user.id,
            venueId: venueId || null,
            incidentType,
            description,
            evidenceImages: evidenceImages || []
        });
        
        res.status(201).json({ success: true, message: 'Incident reported successfully. Support team has been notified.', data: report });
    } catch (err) {
        next(err);
    }
};
