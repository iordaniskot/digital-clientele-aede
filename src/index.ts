import express, { Application, Request, Response } from 'express';
import healthRouter from './routes/health';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to digital-clientele API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
