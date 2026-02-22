import { Router, Request, Response, NextFunction } from 'express';
import { aadeClient } from '../services/aadeClient';
import {
  SendClientRequest,
  UpdateClientRequest,
  ClientCorrelationsRequest,
} from '../types/dcl';
import {
  validateSendClient,
  validateUpdateClient,
  validateCancelClient,
  validateRequestClients,
  validateClientCorrelations,
} from '../middleware/validation';

const router = Router();

/**
 * POST /clients
 * Create a new rental client entry (SendClient)
 *
 * Body: SendClientRequest (JSON)
 * Returns: AADE response with newClientDclID on success
 */
router.post('/', validateSendClient, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: SendClientRequest = req.body;
    const result = await aadeClient.sendClient(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /clients/:dclId
 * Update an existing rental client entry (UpdateClient)
 *
 * Params: dclId — initial DCL ID to update
 * Body: UpdateClientRequest (JSON) — initialDclId can be omitted (taken from URL)
 * Returns: AADE response with updatedClientDclID on success
 */
router.put('/:dclId', validateUpdateClient, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: UpdateClientRequest = {
      ...req.body,
      initialDclId: parseInt(req.params.dclId, 10) || req.body.initialDclId,
    };
    const result = await aadeClient.updateClient(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /clients/:dclId
 * Cancel a rental client entry (CancelClient)
 *
 * Params: dclId — DCL ID to cancel
 * Query: entityVatNumber (optional)
 * Returns: AADE response with cancellationID on success
 */
router.delete('/:dclId', validateCancelClient, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await aadeClient.cancelClient({
      dclId: parseInt(req.params.dclId, 10),
      entityVatNumber: req.query.entityVatNumber as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /clients
 * Fetch client entries (RequestClients)
 *
 * Query:
 *   dclId (required) — starting DCL ID
 *   maxDclId (optional) — max DCL ID filter
 *   entityVatNumber (optional)
 *   continuationToken (optional) — for pagination
 * Returns: Parsed client entries
 */
router.get('/', validateRequestClients, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await aadeClient.requestClients({
      dclId: parseInt(req.query.dclId as string, 10),
      maxDclId: req.query.maxDclId ? parseInt(req.query.maxDclId as string, 10) : undefined,
      entityVatNumber: req.query.entityVatNumber as string | undefined,
      continuationToken: req.query.continuationToken as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /clients/correlations
 * Correlate client entries with MARK or FIM (ClientCorrelations)
 *
 * Body: ClientCorrelationsRequest (JSON)
 * Returns: AADE response with correlateId on success
 */
router.post('/correlations', validateClientCorrelations, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: ClientCorrelationsRequest = req.body;
    const result = await aadeClient.clientCorrelations(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
