import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import entityRouter from './routes/entity';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/movies', entityRouter);
app.use(errorHandler);

export default app;
