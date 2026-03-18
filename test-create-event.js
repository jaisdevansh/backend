import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model.js';

mongoose.connect('mongodb://localhost:27017/stitch_user_db').then(async () => {

    // Find the latest host user
    const u = await User.findOne({ role: { $in: ['host', 'admin', 'superadmin'] } });
    if (!u) {
        console.log('No eligible user found');
        process.exit();
    }

    // Sign token
    const token = jwt.sign({ id: u._id, role: u.role, name: u.name }, 'super_secret_user_key_demo', { expiresIn: '15m' });

    // Send post request using fetch
    const res = await fetch('http://localhost:3000/host/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            title: 'Test Event 123',
            date: '2024-11-20',
            startTime: '10:00 PM',
            tickets: [{ type: 'General Access', price: 100, capacity: 50 }],
            status: 'published'
        })
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    process.exit();
}).catch(console.error);
