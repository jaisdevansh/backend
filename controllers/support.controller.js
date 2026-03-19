import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupportMessage } from "../models/support.model.js";
import Joi from 'joi';

// Validation Schema
export const askSupportSchema = Joi.object({
    message: Joi.string().required().max(500)
});

export const askSupport = async (req, res, next) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        const { error } = askSupportSchema.validate({ message });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // 1. Save User Message
        const userMsg = await SupportMessage.create({
            userId,
            content: message,
            role: 'user'
        });

        // 2. Initialize Gemini
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: "Gemini API Key is not configured in backend." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


        // 3. Fetch recent history for context (optional but better)
        const history = await SupportMessage.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10);

        const context = history.reverse().map(m => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // 4. Generate AI Response
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "You are 'Party Support AI', a premium concierge assistant for 'The Party App'. The Party App helps users find exclusive events, nightclubs, and VIP lounges. Be polite, professional, and helpful. Keep responses concise and focused on support. If a user asks about memberships, mention Essential, Gold, and Black tiers. If they ask about booking, guide them to the booking section." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Party Support AI, ready to assist our premium members with their curated discovery experience on The Party App." }],
                },
                ...context.slice(0, -1) // All except the latest one which we just added
            ],
        });

        const result = await chat.sendMessage(message);
        const aiResponseText = result.response.text();

        // 5. Save AI Response
        const aiMsg = await SupportMessage.create({
            userId,
            content: aiResponseText,
            role: 'ai',
            metadata: {
                model: "gemini-1.5-flash"
            }
        });


        res.status(200).json({
            success: true,
            data: {
                message: aiResponseText,
                historyId: aiMsg._id,
                userMessageId: userMsg._id
            }
        });

    } catch (err) {
        console.error("================ Gemini Error ================");
        console.error(err);
        console.error("==============================================");
        res.status(500).json({
            success: false,
            message: "AI Support failed to respond",
            error: err.message
        });
    }
};

export const getSupportChat = async (req, res, next) => {
    try {
        const messages = await SupportMessage.find({ userId: req.user.id })
            .sort({ createdAt: 1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (err) {
        next(err);
    }
};

export const clearSupportChat = async (req, res, next) => {
    try {
        await SupportMessage.deleteMany({ userId: req.user.id });
        res.status(200).json({
            success: true,
            message: "Chat history cleared successfully"
        });
    } catch (err) {
        next(err);
    }
};

export const deleteSupportMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const message = await SupportMessage.findOne({ _id: id, userId: req.user.id });

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        await SupportMessage.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Message deleted successfully"
        });
    } catch (err) {
        next(err);
    }
};
