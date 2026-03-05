const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY;

app.post('/generate', async (req, res) => {
  try {
    const { default: fetch } = await import('node-fetch');

    // Extract the prompt from the incoming request
    const messages = req.body.messages || [];
    const prompt = messages.map(m => m.content).join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    const data = await response.json();
    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || 'Gemini API error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Generated text length:', text.length);

    // Return in same format as Anthropic so index.html doesn't need changes
    res.json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('ResumeAI Proxy Running ✓'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
