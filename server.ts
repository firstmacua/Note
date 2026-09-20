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

// Direct Calendar ICS endpoint (natively opened by iOS Safari / Apple Calendar)
app.get('/api/calendar/event.ics', (req, res) => {
  try {
    const title = String(req.query.title || 'MikeNote Нагадування');
    const details = String(req.query.details || '');
    const startMs = Number(req.query.start) || (Date.now() + 3600000);
    const duration = Math.max(15, Math.min(240, Number(req.query.duration) || 30));

    const startDate = new Date(startMs);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const formatUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const startStr = formatUtc(startDate);
    const endStr = formatUtc(endDate);
    const nowStr = formatUtc(new Date());
    const uid = `mikenote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@mikenote.app`;

    const cleanTitle = title.replace(/[\r\n]+/g, ' ').trim();
    const cleanDescription = details.replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MikeNote//Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${cleanTitle}`,
      'X-WR-TIMEZONE:UTC',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${cleanTitle}`,
      `DESCRIPTION:${cleanDescription}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${cleanTitle}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    const icsContent = icsLines.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="reminder.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(icsContent);
  } catch (err) {
    console.error('Failed to generate ICS:', err);
    res.status(500).send('Error generating calendar event');
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
