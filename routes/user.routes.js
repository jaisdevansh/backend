import express from 'express';
import { getProfile, updateProfile, changePassword, createBooking, getMyBookings, updateMembership, getAllEvents, bookEvent, getBookedTables, getAllVenues } from '../controllers/user.controller.js';
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
router.post('/events/book', authorize('user'), bookEvent);
router.get('/events/:eventId/booked-tables', getBookedTables);

// Venues
router.get('/venues', getAllVenues);

export default router;
