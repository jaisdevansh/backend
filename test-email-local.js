import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const testSMTP = async () => {
    console.log('Testing SMTP connection...');
    console.log('User:', process.env.SMTP_EMAIL);
    const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : '';
    console.log('Pass Length:', pass.length);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: pass
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Test Sender" <${process.env.SMTP_EMAIL}>`,
            to: process.env.SMTP_EMAIL, // sending to themselves
            subject: "Test Email from Local Setup",
            text: "If you see this, your Gmail App Password configuration works perfectly."
        });
        console.log('SUCCESS! Email sent:', info.messageId);
    } catch (error) {
        console.error('FAILED to send email:', error);
    }
};

testSMTP();
