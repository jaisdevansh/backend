import dotenv from 'dotenv';
dotenv.config();
import sendEmail from './utils/sendEmail.js';

const test = async () => {
    try {
        console.log('Sending test email to:', process.env.SMTP_EMAIL);
        await sendEmail({
            email: process.env.SMTP_EMAIL,
            subject: 'Test Email',
            message: 'This is a test email.'
        });
        console.log('Success!');
    } catch (e) {
        console.error('Failed:', e);
    }
}

test();
