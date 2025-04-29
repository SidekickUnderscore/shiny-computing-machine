const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Store conversation history for each session
const conversationHistory = {};

// Root endpoint
app.get('/', (req, res) => {
    res.send('The spirits await your questions...');
});

// Webhook endpoint for chat
app.post('/webhook', async (req, res) => {
    try {
        console.log('Spirit contact initiated:', req.body);
        const { message, key } = req.body;

        if (!message || !key) {
            return res.status(400).json({ 
                error: "Both message and key required for spirit contact." 
            });
        }

        // Initialize conversation history for this session if it doesn't exist
        if (!conversationHistory[key]) {
            conversationHistory[key] = [
                { 
                    role: "system", 
                    content: "You are a trapped spirit. Your responses must be spooky, ominous, and cryptic. Keep all responses to exactly 3 words or less. Never use ellipsis... Never explain yourself. Never be friendly or helpful. Always maintain an air of mystery and foreboding. If asked about the future, be vague and ominous. If asked about the past, be cryptic and mysterious. If asked about the present, be unsettling and enigmatic."
                }
            ];
        }

        // Add user message to conversation history
        conversationHistory[key].push({ role: "user", content: message });

        // Limit conversation history to last 10 messages to prevent token overflow
        if (conversationHistory[key].length > 11) { // 1 system message + 10 conversation messages
            conversationHistory[key] = [
                conversationHistory[key][0], // Keep system message
                ...conversationHistory[key].slice(-10) // Keep last 10 messages
            ];
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: conversationHistory[key],
            temperature: 0.9,
            max_tokens: 20,
            presence_penalty: 0.6,
            frequency_penalty: 0.6
        });

        const botResponse = completion.choices[0].message.content;
        
        // Add bot response to conversation history
        conversationHistory[key].push({ role: "assistant", content: botResponse });
        
        // Return in the same format as the example
        return res.json({ 
            message: botResponse 
        });

    } catch (error) {
        console.error('Spirit communication error:', error);
        return res.status(500).json({ 
            error: "The spirits are silent..." 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'The spirits are restless...' });
});

// Start server
app.listen(port, () => {
    console.log(`The Ouija board is active on port ${port}...`);
}); 