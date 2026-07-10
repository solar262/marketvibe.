import type { Express, NextFunction, Request, Response } from 'express';
import { getUserByEmail, type Plan } from './db.ts';

export function requirePlan(allowed: Plan[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const email = String(req.header('x-user-email') || req.query.email || '');
    if (!email) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (!allowed.includes(user.plan as Plan)) {
      return res.status(403).json({ error: 'Plan upgrade required.' });
    }

    return next();
  };
}

export function wrapRoute(app: Express, pattern: string, middleware: ReturnType<typeof requirePlan>) {
  app.use(pattern, middleware);
}
