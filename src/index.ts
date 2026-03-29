import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { loadMerchantConfigs, getAllMerchants, validateMerchantConfigs } from './config/merchant.config';
import { authMiddleware } from './middleware/auth';
import healthRouter from './routes/health';
import clientsRouter from './routes/clients';
import invoicesRouter from './routes/invoices';
import billingBooksRouter from './routes/billingBooks';
import branchesRouter from './routes/branches';
import { errorHandler } from './middleware/errorHandler';

// Load merchant configurations from environment
loadMerchantConfigs();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/api/clients', authMiddleware, clientsRouter);
app.use('/api/invoices', authMiddleware, invoicesRouter);
app.use('/api/billing-books', authMiddleware, billingBooksRouter);
app.use('/api/branches', authMiddleware, branchesRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Digital Clientele API — AADE DCL Middleware for Car Rental',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      createClient: 'POST /api/clients',
      getClients: 'GET /api/clients?dclId={id}',
      updateClient: 'PUT /api/clients/:dclId',
      cancelClient: 'DELETE /api/clients/:dclId',
      correlateClient: 'POST /api/clients/correlations',
      createInvoice: 'POST /api/invoices',
      billingBooks: 'GET /api/billing-books',
      branches: 'GET /api/branches',
    },
  });
});

// Global error handler (must be after routes)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  if (!validateMerchantConfigs()) {
    console.warn('⚠️  No merchant configurations found. Check your .env file.');
    console.warn('   Expected pattern: MERCHANT_{key}_API_KEY, MERCHANT_{key}_AADE_USER_ID, etc.');
  } else {
    const merchants = getAllMerchants();
    console.log(`✅ Loaded ${merchants.length} merchant(s): ${merchants.map(m => m.merchantKey).join(', ')}`);
  }
  console.log(`Server running on http://localhost:${config.port}`);
});

export default app;
