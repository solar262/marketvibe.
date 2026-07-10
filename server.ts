import 'dotenv/config';
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkoutHandler } from './api/checkout.ts';
import { customerPortalHandler } from './api/customer-portal.ts';
import { stripeWebhookHandler } from './api/stripe-webhook.ts';
import { subscriptionCheckoutHandler } from './api/subscription-checkout.ts';
import { requirePlan } from './backend/auth.ts';
import { getDb } from './backend/db.ts';

export function createApp(options: { serveStatic?: boolean } = {}) {
  getDb();

  const app = express();
  app.disable('x-powered-by');

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
    try {
      await stripeWebhookHandler(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.use(express.json());

  app.post('/api/checkout', async (req, res, next) => {
    try {
      await checkoutHandler(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/subscription-checkout', async (req, res, next) => {
    try {
      await subscriptionCheckoutHandler(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/customer-portal', async (req, res, next) => {
    try {
      await customerPortalHandler(req, res);
    } catch (error) {
      next(error);
    }
  });

  if (options.serveStatic ?? true) {
    addStaticRoutes(app);
  }

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    res.status(500).json({ error: message });
  });

  return app;
}

function addStaticRoutes(app: express.Express) {
  const distDir = path.join(process.cwd(), 'dist');
  if (!existsSync(distDir)) return;

  app.use('/assets', express.static(path.join(distDir, 'assets')));
  app.use(express.static(distDir));
  app.use('/proofpacks', express.static(path.join(process.env.PUBLIC_DIR || path.join(process.cwd(), 'public'), 'proofpacks')));

  app.get('/pipeline*', requirePlan(['growth', 'partner']), (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });

  app.get('/revenue*', requirePlan(['partner']), (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const port = Number(process.env.PORT || 4242);
  createApp().listen(port, '127.0.0.1', () => {
    console.log(`MarketVibe API listening on http://127.0.0.1:${port}`);
  });
}
