import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator.js';
import sendEmail from '../utils/sendEmail.js';

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'supersecretkey123',
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || 'superrefreshsecret123',
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message, data: {} });

        let user = await User.findOne({ email: value.email });
        if (user) return res.status(400).json({ success: false, message: 'Email already exists', data: {} });

        // Create an un-hashed token to send via email
        const verificationTokenRaw = crypto.randomBytes(20).toString('hex');
        const verificationTokenHashed = crypto
            .createHash('sha256')
            .update(verificationTokenRaw)
            .digest('hex');

        user = new User({
            name: value.name,
            email: value.email,
            password: value.password,
            phone: value.phone,
            role: 'user',
            emailVerified: false,
            verificationToken: verificationTokenHashed,
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours expiry
        });

        user.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase() + user._id.toString().substring(18, 22).toUpperCase();
        await user.save();

        const verifyUrl = `${req.protocol}://${req.get('host')}/auth/verifyemail/${verificationTokenRaw}`;

        const message = `Welcome to Stitch! \n\nPlease click on the link below to verify your email address: \n\n ${verifyUrl} \n\n Or use this token in the app: ${verificationTokenRaw}`;

        // Send Email asynchronously without awaiting to prevent API lag/timeout
        sendEmail({
            email: user.email,
            subject: 'Email Verification - Stitch Curated Discovery',
            message
        }).catch(err => {
            console.error('Background Email sending failed:', err.message);
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. A verification email is being sent.',
            data: {}
        });

    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message, data: {} });

        const user = await User.findOne({ email: value.email });
        if (!user || !(await user.comparePassword(value.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials', data: {} });
        }

        if (!user.emailVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email before login.', data: {} });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated', data: {} });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                accessToken,
                refreshToken
            }
        });
    } catch (err) {
        next(err);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const token = req.body.token || (req.cookies && req.cookies.refreshToken);

        const { error } = refreshTokenSchema.validate({ token });
        if (error || !token) return res.status(400).json({ success: false, message: 'Refresh token required', data: {} });

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'superrefreshsecret123');
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            return res.status(403).json({ success: false, message: 'Invalid or expired refresh token', data: {} });
        }

        const accessToken = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'supersecretkey123',
            { expiresIn: '15m' }
        );

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000
        });

        res.status(200).json({ success: true, message: 'Token refreshed', data: { accessToken } });
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid refresh token', data: {} });
    }
};

export const logout = async (req, res, next) => {
    try {
        if (req.user && req.user.id) {
            await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
        }
        res.clearCookie('accessToken');
        res.status(200).json({ success: true, message: 'Logout successful', data: {} });
    } catch (err) {
        next(err);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message, data: {} });

        const user = await User.findOne({ email: value.email });
        if (!user) {
            return res.status(200).json({ success: true, message: 'If that email exists, a password reset token has been generated.', data: {} });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT or POST request to: \n\n ${resetUrl} \n\n Or use this token in the app: ${resetToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message
            });

            res.status(200).json({
                success: true,
                message: 'Password reset email sent',
                data: {}
            });
        } catch (err) {
            console.error('Email sending failed:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'Email could not be sent', data: {} });
        }
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message, data: {} });

        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(value.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token', data: {} });
        }

        user.password = value.newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.refreshToken = null;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful. Please login again.', data: {} });
    } catch (err) {
        next(err);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const token = req.params.token || req.body.token;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is required', data: {} });
        }

        const verificationToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            verificationToken,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token', data: {} });
        }

        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, message: 'Email verified successfully. Please login.', data: {} });
    } catch (err) {
        next(err);
    }
}
