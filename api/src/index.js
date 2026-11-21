import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import componentRoutes from './routes/componentRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Daftar origin frontend yang diizinkan mengakses API (mendukung CORS_ORIGIN, CORS_ORIGINS, atau FRONTEND_URL, tanpa wildcard *)
const envOrigins =
  process.env.CORS_ORIGIN ||
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  '';
const configuredOrigins = envOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => Boolean(origin) && origin !== '*');

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  ...configuredOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      // Izinkan request tanpa header Origin (misal curl, Postman, atau REST Client)
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      const corsErr = new Error(`Origin ${origin} tidak diizinkan oleh kebijakan CORS.`);
      corsErr.isCors = true;
      return callback(corsErr);
    },
  })
);

app.use(express.json());

// Endpoint 1: Health check server
app.get('/api/health', (_req, res) => {
  return res.status(200).json({
    data: {
      status: 'ok',
      service: 'partsbin-api',
      timestamp: new Date().toISOString(),
    },
  });
});

// Registrasi route utama REST API
app.use('/api/components', componentRoutes);
app.use('/api/projects', projectRoutes);

// Handler 404 untuk path yang tidak terdaftar
app.use((_req, res) => {
  return res.status(404).json({
    error: 'Endpoint tidak ditemukan.',
  });
});

// Middleware error terpusat (wajib didaftarkan paling akhir)
app.use(errorHandler);

// Kenapa dicek !process.env.VERCEL? Di Vercel Serverless, app diekspor tanpa memanggil app.listen().
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`PartsBin API berjalan di http://localhost:${PORT}`);
  });
}

export default app;
