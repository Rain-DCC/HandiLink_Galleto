import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { Type } from '@google/genai';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.ts';
import { getGeminiClient } from '../utils/gemini.ts';
import { logAudit } from '../utils/audit.ts';

export const cebuanoSpeechRouter = Router();

// GET /api/gateway/speech/history
cebuanoSpeechRouter.get('/history', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM speech_transcripts ORDER BY created_at DESC LIMIT 20').all();
  res.json({ transcripts: rows });
});

// POST /api/gateway/speech/transcribe (Accepts recorded audio base64 OR Cebuano text for translation + intent)
cebuanoSpeechRouter.post('/transcribe', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    audioDataUrl: z.string().optional(),
    cebuanoText: z.string().trim().optional(),
    durationLabel: z.string().optional().default('Voice Note'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid speech request payload.' });
    return;
  }

  try {
    const ai = getGeminiClient();
    let cebuanoTranscript = parsed.data.cebuanoText || '';

    // Step 1: If audio provided, transcribe using gemini-3.5-transcribe
    if (parsed.data.audioDataUrl) {
      const match = parsed.data.audioDataUrl.match(/^data:(audio\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({ error: 'Audio must be a valid base64 data URL (audio/webm, audio/wav, audio/mp3).' });
        return;
      }

      const audioPart = {
        inlineData: {
          mimeType: match[1].split(';')[0],
          data: match[2],
        },
      };

      const transcribeRes = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: 'Transcribe this Cebuano / Bisaya / Bagobo-Tagabawa artisan voice message accurately in the original spoken language.',
            },
          ],
        },
      });
      cebuanoTranscript = (transcribeRes.text ?? '').trim();
    }

    if (!cebuanoTranscript) {
      res.status(400).json({ error: 'Please record audio or enter Cebuano text to translate and log.' });
      return;
    }

    // Step 2: Translate Cebuano -> English and extract BIBATAWA operational intent using gemini-4-hydrogen
    const translationRes = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Translate this Cebuano/Bisaya message from a BIBATAWA weaver or coordinator into clear English, and classify the operational intent (e.g., Production Update, Material Restock Request, Cultural Story Dictation, Order Inquiry):

"${cebuanoTranscript}"`,
      config: {
        systemInstruction:
          'You are the HandiLink Cebuano Speech AI assistant supporting Bagobo-Tagabawa women weavers in Davao City.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishTranslation: { type: Type.STRING },
            detectedIntent: { type: Type.STRING },
          },
        },
      },
    });

    const parsedTranslation = JSON.parse((translationRes.text ?? '{}').trim()) as {
      englishTranslation?: string;
      detectedIntent?: string;
    };

    const id = `spc-${crypto.randomUUID().slice(0, 8)}`;
    const englishTranslation = parsedTranslation.englishTranslation || cebuanoTranscript;
    const detectedIntent = parsedTranslation.detectedIntent || 'Production Update';

    db.prepare(`
      INSERT INTO speech_transcripts (id, user_id, source_language, cebuano_transcript, english_translation, detected_intent, audio_duration_label)
      VALUES (?, ?, 'Cebuano / Bisaya', ?, ?, ?, ?)
    `).run(id, req.user!.id, cebuanoTranscript, englishTranslation, detectedIntent, parsed.data.durationLabel);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'CebuanoSpeechAIService',
      action: 'TRANSCRIBE_TRANSLATE',
      resourceType: 'speech_transcript',
      resourceId: id,
      details: `Intent: ${detectedIntent}`,
    });

    const saved = db.prepare('SELECT * FROM speech_transcripts WHERE id = ?').get(id);
    res.json({ transcript: saved });
  } catch (err: any) {
    res.status(502).json({
      error: err?.message || 'Cebuano Speech AI Service failed to process audio or translation.',
    });
  }
});

// POST /api/gateway/speech/tts (Generate spoken audio guidance via gemini-3.8-flash-lite-tts)
cebuanoSpeechRouter.post('/tts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    text: z.string().trim().min(2).max(600),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Text between 2 and 600 characters is required for TTS.' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: parsed.data.text,
              speechMetadata: {
                style: 'Warm, clear, respectful community coordinator voice',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(502).json({ error: 'No audio output returned from TTS model.' });
      return;
    }

    res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (err: any) {
    res.status(502).json({ error: err?.message || 'Speech synthesis service error.' });
  }
});
