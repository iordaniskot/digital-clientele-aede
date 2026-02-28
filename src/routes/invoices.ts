import { Router, Request, Response, NextFunction } from 'express';
import { wrappClient } from '../services/wrappClient';
import { CreateInvoiceRequest } from '../types/invoice';
import { validateCreateInvoice } from '../middleware/invoiceValidation';

const router = Router();

/**
 * POST /invoices
 * Create and issue a new B2B or B2C invoice via Wrapp (third-party provider).
 *
 * B2B invoice type codes: 1.x, 2.x, 3.x, 5.x, 6.x, 7.x, 8.1
 *   — require full counterpart details (VAT, address, etc.)
 *
 * B2C / Retail invoice type codes: 11.x
 *   — require only counterpart name
 *
 * Body: CreateInvoiceRequest (JSON)
 * Returns: Wrapp response with invoice ID, myDATA mark, QR URL, etc.
 */
router.post('/', validateCreateInvoice, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreateInvoiceRequest = req.body;
    const result = await wrappClient.createInvoice(data);

    // Check if the result is a pending response
    if ('status' in result && result.status === 'pending') {
      res.status(202).json(result);
      return;
    }

    // Check if the result is an error response
    if ('errors' in result) {
      res.status(422).json(result);
      return;
    }

    // Success
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
