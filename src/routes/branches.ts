import { Router, Request, Response, NextFunction } from 'express';
import { wrappClient } from '../services/wrappClient';

const router = Router();

/**
 * GET /api/branches
 * Retrieves all branches from the Wrapp API.
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await wrappClient.getBranches();
    res.json(branches);
  } catch (error) {
    next(error);
  }
});

export default router;
