import type { Request, Response } from 'express';
import { createCustomerPortal } from '../backend/stripe.ts';

export async function customerPortalHandler(req: Request, res: Response) {
  const { customerId, returnUrl } = req.body || {};

  if (!customerId || typeof customerId !== 'string') {
    return res.status(400).json({ error: 'customerId is required.' });
  }

  const url = await createCustomerPortal(customerId, returnUrl);
  return res.json({ url });
}
