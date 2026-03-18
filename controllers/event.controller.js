import { Event } from '../models/Event.js';

export const createEvent = async (req, res, next) => {
    try {
        console.log(`[createEvent] Creating new event for host: ${req.user.id}`);

        const { title, description, date, startTime, coverImage, tickets, status } = req.body;

        const event = new Event({
            hostId: req.user.id,
            title,
            description,
            date: new Date(date),
            startTime,
            coverImage,
            tickets,
            status: status || 'draft'
        });

        await event.save();
        console.log(`[createEvent] Event created successfully: ${event._id}`);

        return res.status(201).json({
            success: true,
            eventId: event._id,
            message: "Experience Launched Successfully!"
        });
    } catch (error) {
        console.error(`[createEvent] Error:`, error);
        next(error);
    }
};

export const updateEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const updated = await Event.findByIdAndUpdate(eventId, req.body, { new: true });
        return res.status(200).json({ success: true, eventId: updated._id });
    } catch (error) {
        next(error);
    }
};

export const getEventById = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        return res.status(200).json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

export const updateEventStatus = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const { status } = req.body;
        const updated = await Event.findByIdAndUpdate(eventId, { status }, { new: true });

        return res.status(200).json({ success: true, status: updated.status });
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        await Event.findByIdAndDelete(eventId);

        return res.status(200).json({ success: true, message: "Event Cancelled" });
    } catch (error) {
        next(error);
    }
};

export const getEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ hostId: req.user.id }).sort({ date: 1 });
        return res.status(200).json({ success: true, events });
    } catch (error) {
        next(error);
    }
};
