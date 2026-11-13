import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from './db.ts';
import { authRouter } from './services/authService.ts';
import { proposalComplianceRouter } from './services/proposalComplianceService.ts';
import { catalogueInventoryRouter } from './services/catalogueInventoryService.ts';
import { orderWorkflowRouter } from './services/orderWorkflowService.ts';
import { paymentTrustRouter } from './services/paymentTrustService.ts';
import { shippingLogisticsRouter } from './services/shippingLogisticsService.ts';
import { patternVisionRouter } from './services/patternVisionService.ts';
import { cebuanoSpeechRouter } from './services/cebuanoSpeechService.ts';
import { analyticsReportingRouter } from './services/analyticsReportingService.ts';

export const apiGateway = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in a few minutes.' },
});

// Gateway Health & Microservices Discovery
apiGateway.get('/health', (_req: Request, res: Response) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({
      gateway: 'HandiLink API Gateway',
      status: 'operational',
      database: 'SQLite connected',
      services: [
        'AuthService',
        'ProposalComplianceService',
        'CatalogueInventoryService',
        'OrderWorkflowService',
        'PaymentTrustService',
        'PatternVisionService',
        'CebuanoSpeechAIService',
        'ShippingLogisticsService',
        'AnalyticsReportingService',
      ],
    });
  } catch (err: any) {
    res.status(500).json({ status: 'degraded', error: err?.message || 'Database check failed' });
  }
});

// Auth routes (rate-limited on sensitive auth endpoints)
apiGateway.use('/auth/login', authRateLimiter);
apiGateway.use('/auth/register', authRateLimiter);
apiGateway.use('/auth', authRouter);

// Domain Microservices
apiGateway.use('/', proposalComplianceRouter);
apiGateway.use('/catalogue', catalogueInventoryRouter);
apiGateway.use('/workflow', orderWorkflowRouter);
apiGateway.use('/payments', paymentTrustRouter);
apiGateway.use('/logistics', shippingLogisticsRouter);
apiGateway.use('/vision', patternVisionRouter);
apiGateway.use('/speech', cebuanoSpeechRouter);
apiGateway.use('/analytics', analyticsReportingRouter);

// Gateway 404 fallback
apiGateway.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'API Gateway route not found.' });
});

// Gateway structured JSON error handler
apiGateway.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof err?.status === 'number' && err.status >= 400 ? err.status : 500;
  res.status(status).json({
    error: err?.message || 'An unexpected API Gateway error occurred.',
  });
});
