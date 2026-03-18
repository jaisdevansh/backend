export const validate = (schema) => (req, res, next) => {
    if (!schema || !schema.validate) {
        return next();
    }

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map(detail => detail.message).join(', ')
        });
    }
    next();
};
