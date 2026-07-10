import type { Request, Response } from 'express';
import { createRadarSubscriptionCheckout } from '../backend/stripe.ts';

export async function subscriptionCheckoutHandler(req: Request, res: Response) {
  const { plan = 'radar', email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const url = await createRadarSubscriptionCheckout(String(plan), email);
  return res.json({ url });
}
