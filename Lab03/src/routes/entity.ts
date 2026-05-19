import { NextFunction, Request, Response, Router } from 'express';
import { createSchema, filterSchema, updateSchema } from '../schemas/entity.schema';
import { validate } from '../middleware/validate';
import * as storage from '../storage/entity';

const router = Router();

router.get('/recent', (_req: Request, res: Response) => {
  res.json(storage.getRecent());
});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = filterSchema.parse(req.query);
    res.json(storage.getAll(filters));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const movie = storage.getById(req.params.id);
  if (!movie) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(movie);
});

router.post('/', validate(createSchema), (req: Request, res: Response) => {
  const movie = storage.create(req.body);
  res.status(201).json(movie);
});

router.patch('/:id', validate(updateSchema), (req: Request<{ id: string }>, res: Response) => {
  const movie = storage.update(req.params.id, req.body);
  if (!movie) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(movie);
});

router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  const deleted = storage.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
});

export default router;
