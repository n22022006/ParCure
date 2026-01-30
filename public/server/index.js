import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

// WARNING: Hardcoding API keys is insecure in production. Use env vars instead.
// Per your request, the Gemini API key is embedded here on the server.
const GEMINI_API_KEY = 'AIzaSyDkeglJt95LQUJ_LWjbtiLEaP7hwbleKSc';

const PORT = process.env.PORT || 3001;
const app = express();

// =============================================================
// CORS - Development-safe handling with explicit preflight support
// =============================================================
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'saathi-backend', model: 'gemini-1.5-flash' });
});

// Handle GET calls to chat with a clear method error (avoid confusing 426)
// The chat endpoint is POST-only for sending messages.
app.get('/api/saathi/chat', (req, res) => {
  res.status(405).json({ error: 'Use POST for this endpoint' });
});

// Silence browser favicon requests to keep console clean
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Saathi chat endpoint (Gemini proxy)
app.post('/api/saathi/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Construct Gemini request body
    // Use short system instruction to set role: professional doctor + dietitian for Parkinson's
    const systemInstruction = {
      role: 'system',
      parts: [
        {
          text:
            "You are Dr. Saathi, a professional medical doctor and dietitian specializing in Parkinson's disease.\n" +
            "Provide supportive, practical, concise guidance in plain text.\n" +
            "Use bullet-like lines separated by newlines (no markdown symbols).\n" +
            "Offer evidence-informed suggestions, lifestyle and diet tips, and clear next steps.\n" +
            "Include safety: advise consulting a clinician for urgent or personal medical decisions."
        }
      ]
    };

    // Convert light chat history into Gemini "contents" format
    const contents = [];
    for (const item of history.slice(-10)) {
      contents.push({ role: item.role === 'user' ? 'user' : 'model', parts: [{ text: String(item.text || '') }] });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const body = {
      system_instruction: systemInstruction,
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 512,
        presencePenalty: 0.4,
        frequencyPenalty: 0.4
      }
    };

    // Call Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: 'Gemini request failed', details: errText });
    }

    const data = await resp.json();

    // Extract plain text from Gemini response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    res.json({ text });
  } catch (err) {
    console.error('Saathi backend error:', err);
    res.status(500).json({ error: 'Server error', message: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Saathi backend listening on http://localhost:${PORT}`);
});
