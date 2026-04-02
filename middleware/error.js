import { logger } from '../logs/logger.js';

export const errorHandler = (error, req, res, next) => {
    logger.error(`Error on ${req.method} ${req.url}:`, error);

    // Mongoose duplicate key error
    if (error.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate key error: Resource already exists'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            details: error.message
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        data: {}
    });
};
