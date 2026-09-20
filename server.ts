import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Candidate models in order of priority (starting with high-availability, fast flash models)
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config: {
      systemInstruction: string;
      temperature: number;
      maxOutputTokens: number;
    };
  }
): Promise<string> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[AI] Model ${modelName} (attempt ${attempt + 1}) error: ${errMsg}`);

        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('fetch failed');

        if (isTransient && attempt === 0) {
          // Short jitter delay before retry
          await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
        } else {
          // Move to next candidate model
          break;
        }
      }
    }
  }

  throw lastError || new Error('Всі моделі генерації тимчасово недоступні');
}

// Mini-chat Idea generator endpoint
app.post('/api/generate-idea', async (req, res) => {
  const { prompt, language = 'uk', chatHistory } = req.body;
  try {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAIClient();
    const systemInstruction = `Ти — доброзичливий, лаконічний ШІ-помічник для генерації ідей у додатку нотаток MikeNote.
Користувач пише запит із ключовими словами (наприклад: "що подарувати татові на день народження", "ідеї для бізнесу", "що приготувати на вечерю").
Твоє завдання:
1. Дати коротку, чітку, практичну і надихаючу відповідь.
2. Надати 3-5 найкращих варіантів списком із короткими поясненнями (1-2 речення на пункт).
3. Додати 1 коротку практичну пораду.
4. Мова: ${language === 'en' ? 'англійська' : 'українська'}.
5. Не додавай зайвих довгих вступів та закінчень, пиши одразу суть у форматі гарно структурованого списку.`;

    let userContent = prompt.trim();
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const historyContext = chatHistory
        .slice(-6)
        .map((m: { sender: string; text: string }) => `${m.sender === 'user' ? 'Користувач' : 'ШІ'}: ${m.text}`)
        .join('\n');
      userContent = `Контекст попередньої розмови:\n${historyContext}\n\nНовий запит користувача: ${prompt.trim()}`;
    }

    const reply = await generateWithFallback(ai, {
      contents: userContent,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 700,
      },
    });

    return res.json({ result: reply });
  } catch (error: any) {
    console.error('Idea generation final failure:', error);

    // Extract human-readable message if possible
    let cleanMessage =
      language === 'en'
        ? 'The AI model is currently busy. Please tap "Try again" in a moment.'
        : 'ШІ-сервіс зараз має високе навантаження. Будь ласка, натисніть «Спробувати знову».';

    return res.status(503).json({
      error: cleanMessage,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
