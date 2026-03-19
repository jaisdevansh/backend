import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Booking } from '../models/booking.model.js';
import { Event } from '../models/Event.js';
import { Notification } from '../models/notification.model.js';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SPXu9raqQAlU2T',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'V3pU4sMZdEEPwPzT' // Should use secret
});

export const createOrder = async (req, res, next) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingData
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'V3pU4sMZdEEPwPzT')
            .update(sign.toString())
            .digest("hex");

        // Allow simulated signature for development/testing if enabled or explicitly checked
        const isVerified = razorpay_signature === expectedSign || 
                          (process.env.NODE_ENV !== 'production' && razorpay_signature === 'simulated_signature');

        if (isVerified) {

            // Payment verified - Create Booking
            const { eventId, hostId, ticketType, tableId, pricePaid } = bookingData;
            
            const booking = await Booking.create({
                userId: req.user.id,
                hostId,
                eventId,
                serviceId: eventId,
                ticketType,
                tableId: tableId || null,
                pricePaid: pricePaid || 0,
                status: 'approved',
                paymentStatus: 'paid'
            });

            // If it's an event booking, increment sold count
            if (eventId) {
                const event = await Event.findById(eventId);
                if (event) {
                    const ticket = event.tickets.find(t => t.type === ticketType);
                    if (ticket) {
                        ticket.sold += 1;
                        await event.save();
                    }
                }
            }

            // Create notification for user
            await Notification.create({
                userId: req.user.id,
                title: 'Booking Confirmed! 🎉',
                message: `Your booking for ${ticketType} was successful. See you there!`,
                type: 'booking',
                metadata: { bookingId: booking._id }
            });

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                data: booking
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        next(error);
    }
};
