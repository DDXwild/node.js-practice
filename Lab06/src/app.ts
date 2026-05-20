import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler';
import entityRouter from './routes/entity';

const app = express();

app.get('/health', (_req, res) => {
  const readyState = mongoose.connection.readyState;
  const connected = readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: {
      readyState,
      connected,
    },
  });242141241
});dasdasdasd

app.use(cors());
app.use(express.json());
app.use('/api/movies', entityRouter);
app.use(errorHandler);

export default app;
