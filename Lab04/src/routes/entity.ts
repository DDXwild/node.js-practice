import { NextFunction, Request, Response, Router } from 'express';
import { createSchema, listQuerySchema, updateSchema } from '../schemas/entity.schema';
import { validate } from '../middleware/validate';
import * as storage from '../storage/entity';

const router = Router();

router.get('/recent', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await storage.getRecent());
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await storage.findAll(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const movie = await storage.getById(req.params.id);
    if (!movie) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movie = await storage.create(req.body);
    res.status(201).json(movie);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id',
  validate(updateSchema),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const movie = await storage.update(req.params.id, req.body);
      if (!movie) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(movie);
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const deleted = await storage.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
