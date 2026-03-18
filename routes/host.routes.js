import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    updateEventStatus,
    deleteEvent
} from '../controllers/event.controller.js';
import { getBookings, checkInQR } from '../controllers/booking.controller.js';
import {
    createTicket,
    getTickets,
    getTicketById
} from '../controllers/ticket.controller.js';
import {
    getHostProfile,
    updateHostProfile,
    getVenueProfile,
    updateVenueProfile,
    getPayments,
    getPayouts,
    getStaff,
    addStaff,
    removeStaff,
    getMedia,
    uploadMedia,
    approveMedia,
    removeMedia,
    getCoupons,
    createCoupon,
    removeCoupon
} from '../controllers/host.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import { createEventSchema } from '../validators/event.validator.js';
import { updateVenueSchema } from '../validators/venue.validator.js';
import { scanQRSchema } from '../validators/booking.validator.js';

const router = express.Router();

// Apply global host authentication to all /host/* routes
router.use(protect);
router.use(authorize('host', 'admin', 'superadmin'));

// --- DASHBOARD ---
router.get('/dashboard/summary', getDashboardSummary);

// --- PROFILE ---
router.get('/profile', getHostProfile);
router.put('/profile/update', updateHostProfile);
router.get('/venue-profile', getVenueProfile);
router.put('/profile/venue', validate(updateVenueSchema), updateVenueProfile);

// --- PAYMENTS & PAYOUTS ---
router.get('/payments', getPayments);
router.get('/payouts', getPayouts);

// --- STAFF ---
router.get('/staff', getStaff);
router.post('/staff/add', addStaff);
router.delete('/staff/remove/:staffId', removeStaff);

// --- MEDIA ---
router.get('/media', getMedia);
router.post('/media/upload', uploadMedia);
router.put('/media/approve', approveMedia);
router.delete('/media/remove/:mediaId', removeMedia);

// --- COUPONS ---
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:couponId', removeCoupon);

// --- TICKETS ---
router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.get('/tickets/:ticketId', getTicketById);

// --- EVENTS ---
router.post('/events', validate(createEventSchema), createEvent);
router.get('/events', getEvents);
router.get('/events/:eventId', getEventById);
router.put('/events/:eventId', updateEvent);
router.patch('/events/:eventId/status', updateEventStatus);
router.delete('/events/:eventId', deleteEvent);

// --- BOOKINGS ---
router.get('/bookings', getBookings);
router.post('/bookings/check-in', validate(scanQRSchema), checkInQR);

export default router;
