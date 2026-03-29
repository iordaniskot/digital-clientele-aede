import { Router, Request, Response, NextFunction } from 'express';
import { CreateBillingBookRequest, UpdateBillingBookRequest } from '../types/billingBook';

const router = Router();

/**
 * GET /api/billing-books
 * Retrieves all billing books from the Wrapp API.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const billingBooks = await req.wrappClient!.getBillingBooks();
    res.json(billingBooks);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/billing-books
 * Create a new billing book in Wrapp.
 *
 * Body: { name, series, number, invoice_type_code }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, series, number, invoice_type_code } = req.body;

    const errors: string[] = [];
    if (!name) errors.push('name is required');
    if (!series) errors.push('series is required');
    if (number == null) errors.push('number is required');
    if (!invoice_type_code) errors.push('invoice_type_code is required');

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    const data: CreateBillingBookRequest = { name, series, number, invoice_type_code };
    const result = await req.wrappClient!.createBillingBook(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/billing-books/:id
 * Update an existing billing book in Wrapp.
 *
 * Body: { name?, series?, number?, invoice_type_code? }
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, series, number, invoice_type_code } = req.body;

    const data: UpdateBillingBookRequest = {};
    if (name !== undefined) data.name = name;
    if (series !== undefined) data.series = series;
    if (number !== undefined) data.number = number;
    if (invoice_type_code !== undefined) data.invoice_type_code = invoice_type_code;

    const result = await req.wrappClient!.updateBillingBook(id, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
