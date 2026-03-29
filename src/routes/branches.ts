import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * GET /api/branches
 * Retrieves all branches from the Wrapp API.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await req.wrappClient!.getBranches();
    res.json(branches);
  } catch (error) {
    next(error);
  }
});

export default router;
