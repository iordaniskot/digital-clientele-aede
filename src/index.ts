import express, { Application, Request, Response } from 'express';
import { config } from './config';
import healthRouter from './routes/health';
import clientsRouter from './routes/clients';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/api/clients', clientsRouter);

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
    },
  });
});

// Global error handler (must be after routes)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

export default app;
