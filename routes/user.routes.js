import express from 'express';
import { getProfile, updateProfile, changePassword, createBooking, getMyBookings, updateMembership, getAllEvents, getEventById, bookEvent, getBookedTables, getAllVenues, getVenueById } from '../controllers/user.controller.js';

import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// All routes here require authentication
router.use(protect);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Membership
router.put('/membership', updateMembership);

// Bookings
router.post('/book', authorize('user'), createBooking);
router.get('/bookings', getMyBookings); // Optionally restrict by 'user' if only users can view "my bookings"

// Events
router.get('/events', getAllEvents);
router.get('/events/:id', getEventById);

router.post('/events/book', authorize('user'), bookEvent);
router.get('/events/:eventId/booked-tables', getBookedTables);

// Venues
router.get('/venues', getAllVenues);
router.get('/venues/:id', getVenueById);

// Feedback & Ratings
import { submitAppRating, getReferralData, applyReferralCode, sendSplitRequest, getSplitRequests, respondSplitRequest } from '../controllers/user.controller.js';

router.post('/rate', submitAppRating);

// Referrals
router.get('/referral', getReferralData);
router.post('/referral/apply', applyReferralCode);

// Split Payments
router.post('/split-requests', sendSplitRequest);
router.get('/split-requests', getSplitRequests);
router.put('/split-requests', respondSplitRequest);

export default router;
