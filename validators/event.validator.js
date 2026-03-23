import Joi from 'joi';

export const createEventSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    date: Joi.string().required(), // accepting any string that can be parsed into a date
    startTime: Joi.string().required(),
    description: Joi.string().allow('', null).optional(),
    coverImage: Joi.string().uri().optional(),
    tickets: Joi.array().items(
        Joi.object({
            type: Joi.string().required(),
            price: Joi.number().min(0).required(),
            capacity: Joi.number().min(1).required()
        })
    ).min(1).required(),
    status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').optional()
});

export const updateEventStatusSchema = Joi.object({
    status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').required()
});
