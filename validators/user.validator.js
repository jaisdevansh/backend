import Joi from 'joi';

export const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().min(10).max(15).optional(),
    profileImage: Joi.string().allow('').optional()
});

export const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
});

export const createBookingSchema = Joi.object({
    hostId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // MongoDB ObjectId regex
    serviceId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    ticketType: Joi.string().optional(),
    pricePaid: Joi.number().optional()
});

export const updateMembershipSchema = Joi.object({
    tier: Joi.string().valid('Essential', 'Gold', 'Black').required()
});

export const bookEventSchema = Joi.object({
    eventId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    ticketType: Joi.string().required(),
    tableId: Joi.string().optional()
});
