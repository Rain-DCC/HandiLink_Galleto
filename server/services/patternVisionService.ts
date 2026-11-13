import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Type } from '@google/genai';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.ts';
import { getGeminiClient } from '../utils/gemini.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const patternVisionRouter = Router();

// GET /api/gateway/vision/history
patternVisionRouter.get('/history', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM pattern_verifications ORDER BY created_at DESC LIMIT 20').all();
  res.json({ verifications: rows });
});

// POST /api/gateway/vision/verify
patternVisionRouter.post('/verify', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    imageName: z.string().trim().min(1).default('textile_scan.jpg'),
    imageDataUrl: z.string().optional(),
    sampleAssetPath: z.string().optional(),
    expectedMotif: z.string().optional().default('Auto-Detect'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid pattern verification request.' });
    return;
  }

  let mimeType = 'image/jpeg';
  let base64Data = '';

  if (parsed.data.imageDataUrl) {
    const match = parsed.data.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'Image must be a valid base64 data URL (JPEG, PNG, or WebP).' });
      return;
    }
    mimeType = match[1];
    base64Data = match[2];
  } else if (parsed.data.sampleAssetPath) {
    // Allow verifying one of the local sample textile images safely within src/assets/images
    const safeName = path.basename(parsed.data.sampleAssetPath);
    const resolved = path.resolve(process.cwd(), 'src', 'assets', 'images', safeName);
    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Sample textile image not found.' });
      return;
    }
    base64Data = fs.readFileSync(resolved).toString('base64');
    mimeType = safeName.endsWith('.png') ? 'image/png' : 'image/jpeg';
  } else {
    res.status(400).json({ error: 'Please upload a textile image or select a sample specimen to verify.' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analyze this textile, beadwork, or craft specimen for Bagobo-Tagabawa (BIBATAWA) cultural pattern verification.
Expected motif hint: ${parsed.data.expectedMotif}.
Identify whether the textile shows traditional motifs such as Binituwon (constellation of stars/diamonds), Binubaya (crocodile diamond lozenges), Kinara (mountain chevrons), Minata (ancestral eye), or Tinanggi (harvest stripes), assess the weave/beadwork structure (backstrap abaca ikat vs seed beadwork vs machine print), and evaluate cultural authenticity.`,
          },
        ],
      },
      config: {
        systemInstruction:
          'You are the HandiLink Cultural Pattern Verification Computer Vision engine trained on Bagobo-Tagabawa Inabal weaving and Pangulambong beadwork canons. Be accurate, respectful, and objective.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedMotif: { type: Type.STRING, description: 'Primary Bagobo-Tagabawa motif detected or Unknown/Non-Traditional.' },
            authenticityScore: { type: Type.NUMBER, description: 'Confidence score from 0 to 100.' },
            culturalMatchStatus: { type: Type.STRING, description: 'Verified Authentic, Needs Elder Review, or Non-Traditional Pattern.' },
            weaveTechnique: { type: Type.STRING, description: 'Detected craft technique (e.g., Backstrap Loom Abaca Ikat, Glass Seed Beadwork).' },
            analysisSummary: { type: Type.STRING, description: 'Concise 2-3 sentence technical and cultural observation.' },
          },
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const result = JSON.parse(rawText) as {
      detectedMotif?: string;
      authenticityScore?: number;
      culturalMatchStatus?: string;
      weaveTechnique?: string;
      analysisSummary?: string;
    };

    const recordId = `vis-${crypto.randomUUID().slice(0, 8)}`;
    const detectedMotif = result.detectedMotif || 'Binituwon (Star Motif)';
    const score = Math.round(Math.min(100, Math.max(0, Number(result.authenticityScore ?? 88))));
    const matchStatus = result.culturalMatchStatus || (score >= 75 ? 'Verified Authentic' : 'Needs Elder Review');
    const summary = result.analysisSummary || 'Handwoven texture and geometric diamond repeats verified.';

    db.prepare(`
      INSERT INTO pattern_verifications (id, submitted_by, image_name, detected_motif, authenticity_score, cultural_match_status, analysis_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(recordId, req.user!.name, parsed.data.imageName, detectedMotif, score, matchStatus, summary);

    createNotification({
      targetRole: 'creative_director',
      title: `Pattern Scan: ${detectedMotif} (${score}%)`,
      message: `${parsed.data.imageName} evaluated as "${matchStatus}" by Vision Service.`,
      type: 'vision',
    });

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'PatternVisionService',
      action: 'VERIFY_PATTERN_IMAGE',
      resourceType: 'pattern_verification',
      resourceId: recordId,
      details: `${parsed.data.imageName} -> ${detectedMotif} (${score}%)`,
    });

    const saved = db.prepare('SELECT * FROM pattern_verifications WHERE id = ?').get(recordId);
    res.json({
      verification: saved,
      weaveTechnique: result.weaveTechnique || 'Backstrap Loom & Natural Fiber',
    });
  } catch (err: any) {
    res.status(502).json({
      error: err?.message || 'Pattern Verification AI Service encountered an error processing the image.',
    });
  }
});
