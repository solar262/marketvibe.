import type { Request, Response } from 'express';
import { createProofCheckout } from '../backend/stripe.ts';

export async function checkoutHandler(req: Request, res: Response) {
  const { niche, email } = req.body || {};

  if (!niche || typeof niche !== 'string') {
    return res.status(400).json({ error: 'niche is required.' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const url = await createProofCheckout(niche, email);
  return res.json({ url });
}
