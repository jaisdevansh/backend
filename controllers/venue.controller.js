import { Venue } from '../models/Venue.js';

export const getVenueProfile = async (req, res, next) => {
    try {
        const venue = await Venue.findOne({ hostId: req.user.id });
        if (!venue) {
            // Return empty venue structure instead of 404 to allow initial creation
            return res.status(200).json({
                success: true,
                data: {
                    name: '',
                    venueType: 'Nightclub',
                    description: '',
                    address: '',
                    capacity: 0,
                    openingTime: '10:00 PM',
                    closingTime: '04:00 AM',
                    rules: '',
                    heroImage: '',
                    images: []
                }
            });
        }
        res.status(200).json({ success: true, data: venue });
    } catch (error) {
        next(error);
    }
};

export const updateVenueProfile = async (req, res, next) => {
    try {
        const {
            name,
            venueType,
            description,
            address,
            capacity,
            openingTime,
            closingTime,
            rules,
            heroImage,
            images,
            coordinates
        } = req.body;


        const venue = await Venue.findOneAndUpdate(
            { hostId: req.user.id },
            {
                name,
                venueType,
                description,
                address,
                capacity,
                openingTime,
                closingTime,
                rules,
                heroImage,
                images,
                coordinates,
                hostId: req.user.id
            },

            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Venue profile updated successfully',
            data: venue
        });
    } catch (error) {
        next(error);
    }
};
