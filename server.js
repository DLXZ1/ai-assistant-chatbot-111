console.log('✅ Current API Key:', process.env.OPENROUTER_API_KEY);

require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false
}));

app.options('*', cors());

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Log requests for debugging
app.use((req, res, next) => {
    console.log(`📡 Request: ${req.method} ${req.url}`);
    next();
});

// ✅ 正确使用 OpenRouter 和 Claude 模型
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

app.post('/api/text', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('📝 Received text prompt:', prompt);

        const response = await openai.chat.completions.create({
            model: 'anthropic/claude-3-haiku',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            res.write(content);
        }
        res.end();
    } catch (error) {
        console.error('❌ Claude API Error:', error);
        res.status(500).json({ error: 'Failed to process text input' });
    }
});


app.post('/api/image', async (req, res) => {
    try {
        const { imageUrl, prompt } = req.body;
        console.log('🖼️ Received image prompt:', prompt, 'Image URL:', imageUrl);

        const response = await openai.chat.completions.create({
            model: 'anthropic/claude-3-haiku',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt || 'What’s in this image?' },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]
                }
            ],
            stream: true
        });


        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            res.write(content);
        }
        res.end();

    } catch (error) {
        console.error('❌ Claude image API error:', error);
        res.status(500).json({ error: error.message || 'Failed to process image input' });
    }
});


app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));
