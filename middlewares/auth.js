import { env } from '../config/env.js';

export const verifyJWT = async (request, reply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.status(401).send({ success: false, message: 'Unauthorized or Token Expired' });
    }
};

export const requireHostRole = async (request, reply) => {
    if (request.user.role !== 'host' && request.user.role !== 'admin') {
        reply.status(403).send({ success: false, message: 'Forbidden: Host Access Required' });
    }
};

export const verifyOwnership = (model) => {
    return async (request, reply) => {
        const resourceId = request.params.id || request.params.eventId;
        const resource = await model.findById(resourceId);

        if (!resource) {
            return reply.status(404).send({ success: false, message: 'Resource not found' });
        }

        if (resource.hostId.toString() !== request.user.id && request.user.role !== 'admin') {
            return reply.status(403).send({ success: false, message: 'Forbidden: You do not own this resource' });
        }
    };
};
