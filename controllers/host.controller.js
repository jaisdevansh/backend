import { User } from '../models/user.model.js';
import { Venue } from '../models/Venue.js';
import { Booking } from '../models/booking.model.js';
import { Staff } from '../models/Staff.js';
import { Payout } from '../models/Payout.js';
import { Media } from '../models/Media.js';
import { Coupon } from '../models/Coupon.js';

// --- HOST ACCOUNT PROFILE ---
export const getHostProfile = async (req, res, next) => {
    try {
        console.log(`[getHostProfile] Fetching profile for userID: ${req.user.id}`);
        const user = await User.findById(req.user.id).select('-password -refreshToken');
        const venue = await Venue.findOne({ hostId: req.user.id });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                hostName: user.name,
                profileImage: user.profileImage,
                email: user.email,
                contactNumber: user.phone,
                businessName: venue?.name || '',
                venueId: venue?._id
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateHostProfile = async (req, res, next) => {
    try {
        const { hostName, profileImage, contactNumber } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, {
            name: hostName,
            profileImage,
            phone: contactNumber
        }, { new: true });

        res.status(200).json({
            success: true,
            message: 'Account updated successfully',
            data: {
                hostName: user.name,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        next(error);
    }
};

// --- VENUE MANAGEMENT ---
export const getVenueProfile = async (req, res, next) => {
    try {
        console.log(`[getVenueProfile] Fetching venue for hostID: ${req.user.id}`);
        const venue = await Venue.findOne({ hostId: req.user.id });

        if (!venue) {
            // Return defaults if none found
            return res.status(200).json({
                success: true,
                data: {
                    name: '',
                    venueType: 'Nightclub',
                    description: '',
                    address: '',
                    capacity: 0,
                    openingTime: '10:00 PM',
                    closingTime: '04:00 AM',
                    rules: 'Strictly Elegant',
                    heroImage: '',
                    images: [],
                    amenities: []
                }
            });
        }

        res.status(200).json({ success: true, data: venue });
    } catch (error) {
        console.error(`[getVenueProfile] Error:`, error);
        next(error);
    }
};

export const updateVenueProfile = async (req, res, next) => {
    try {
        console.log(`[updateVenueProfile] Updating venue for hostID: ${req.user.id}`);
        const {
            name,
            venueType,
            description,
            address,
            capacity,
            openingTime,
            closingTime,
            rules,
            heroImage,
            images,
            amenities,
            menu
        } = req.body;

        const updateObj = {
            name,
            venueType,
            description,
            address,
            capacity: parseInt(capacity) || 0,
            openingTime,
            closingTime,
            rules,
            heroImage,
            images,
            amenities,
            menu,
            hostId: req.user.id
        };

        console.log(`[updateVenueProfile] Update object:`, JSON.stringify({ ...updateObj, heroImage: updateObj.heroImage ? 'TRUNCATED' : null }, null, 2));

        const venue = await Venue.findOneAndUpdate(
            { hostId: req.user.id },
            updateObj,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Venue profile updated successfully',
            data: venue
        });
    } catch (error) {
        console.error(`[updateVenueProfile] Error:`, error);
        next(error);
    }
};

// --- PAYMENTS & PAYOUTS ---
export const getPayments = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ hostId: req.user.id })
            .populate('userId', 'name profileImage')
            .sort({ createdAt: -1 });

        const mappedPayments = bookings.map(b => ({
            id: b._id,
            memberName: b.userId?.name || 'Unknown',
            memberImage: b.userId?.profileImage || '',
            plan: b.ticketType || 'Standard',
            amount: b.pricePaid || 0,
            status: b.paymentStatus === 'paid' ? 'Success' : 'Pending',
            date: b.createdAt
        }));

        res.status(200).json({ success: true, data: mappedPayments });
    } catch (error) {
        next(error);
    }
};

export const getPayouts = async (req, res, next) => {
    try {
        const payouts = await Payout.find({ hostId: req.user.id }).sort({ date: -1 });

        // Calculate totals
        const bookings = await Booking.find({ hostId: req.user.id, paymentStatus: 'paid' });
        const totalEarnings = bookings.reduce((sum, b) => sum + (b.pricePaid || 0), 0);

        const completedPayouts = payouts
            .filter(p => p.status === 'Success')
            .reduce((sum, p) => sum + p.amount, 0);

        const pendingPayouts = totalEarnings - completedPayouts;

        res.status(200).json({
            success: true,
            data: {
                history: payouts,
                summary: {
                    totalEarnings,
                    pendingPayout: Math.max(0, pendingPayouts),
                    completedPayout: completedPayouts
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// --- STAFF ---
export const getStaff = async (req, res, next) => {
    try {
        const staff = await Staff.find({ hostId: req.user.id });
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        next(error);
    }
};

export const addStaff = async (req, res, next) => {
    try {
        const { name, email, role } = req.body;
        const staff = await Staff.create({
            hostId: req.user.id,
            name,
            email,
            role,
            status: 'Active'
        });
        res.status(201).json({ success: true, data: staff, message: 'Staff added successfully' });
    } catch (error) {
        next(error);
    }
};

export const removeStaff = async (req, res, next) => {
    try {
        const { staffId } = req.params;
        await Staff.findOneAndDelete({ _id: staffId, hostId: req.user.id });
        res.status(200).json({ success: true, message: 'Staff removed successfully' });
    } catch (error) {
        next(error);
    }
};

// --- MEDIA MANAGEMENT ---
export const getMedia = async (req, res, next) => {
    try {
        const media = await Media.find({ hostId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: media });
    } catch (error) {
        next(error);
    }
};

export const uploadMedia = async (req, res, next) => {
    try {
        const { url, type, fileName, fileSize, mimeType } = req.body;
        const media = await Media.create({
            hostId: req.user.id,
            url,
            type: type || 'image',
            status: 'Pending', // Back to pending until saved
            fileName,
            fileSize,
            mimeType
        });
        res.status(201).json({ success: true, data: media, message: 'Media uploaded for approval' });
    } catch (error) {
        next(error);
    }
};

export const removeMedia = async (req, res, next) => {
    try {
        const { mediaId } = req.params;
        await Media.findOneAndDelete({ _id: mediaId, hostId: req.user.id });
        res.status(200).json({ success: true, message: 'Media removed successfully' });
    } catch (error) {
        next(error);
    }
};

// --- COUPON MANAGEMENT ---
export const getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find({ hostId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        next(error);
    }
};

export const createCoupon = async (req, res, next) => {
    try {
        const { code, discountType, discountValue, minPurchase, expiryDate, usageLimit } = req.body;
        const coupon = await Coupon.create({
            hostId: req.user.id,
            code,
            discountType,
            discountValue,
            minPurchase,
            expiryDate,
            usageLimit
        });
        res.status(201).json({ success: true, data: coupon, message: 'Coupon created successfully' });
    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to create coupon' });
    }
};

export const removeCoupon = async (req, res, next) => {
    try {
        const { couponId } = req.params;
        await Coupon.findOneAndDelete({ _id: couponId, hostId: req.user.id });
        res.status(200).json({ success: true, message: 'Coupon removed successfully' });
    } catch (error) {
        next(error);
    }
};

export const approveMedia = async (req, res, next) => {
    try {
        await Media.updateMany(
            { hostId: req.user.id, status: 'Pending' },
            { status: 'Approved' }
        );
        res.status(200).json({ success: true, message: 'Gallery confirmed successfully' });
    } catch (error) {
        next(error);
    }
};
