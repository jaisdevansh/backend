import { logger } from '../logs/logger.js';

export const errorHandler = (error, request, reply) => {
    logger.error(`Error on ${request.method} ${request.url}:`, error);

    // Mongoose duplicate key error
    if (error.code === 11000) {
        return reply.status(400).send({
            success: false,
            message: 'Duplicate key error: Resource already exists'
        });
    }

    if (error.name === 'ValidationError') {
        return reply.status(400).send({
            success: false,
            message: 'Validation Error',
            details: error.message
        });
    }

    // Default error
    reply.status(500).send({
        success: false,
        message: 'Internal Server Error'
    });
};
