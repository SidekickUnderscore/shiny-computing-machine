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

// Root endpoint
app.get('/', (req, res) => {
    res.send('Hello! The bot server is running. Try POST /webhook with JSON.');
});

// Webhook endpoint for chat
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook activated:', req.body);
        const { message, key } = req.body;

        if (!message || !key) {
            return res.status(400).json({ 
                error: "Both 'message' and 'key' are required." 
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const botResponse = completion.choices[0].message.content;
        
        // Return in the same format as the example
        return res.json({ 
            message: botResponse 
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: error.message || "Internal server error." 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 