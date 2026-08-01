import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());

// Flexible CORS configuration for dev & production
app.use(
  cors({
    origin: true, // Allows all origins dynamically (handles ports 5173, 5174, etc.)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'AskFlow AI Backend Server',
    timestamp: new Date().toISOString(),
    env: {
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    },
  });
});

// Chat API Routes
app.use('/api/chat', chatRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 AskFlow AI Express Server active on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`===========================================`);
});
