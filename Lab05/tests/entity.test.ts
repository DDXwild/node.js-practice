import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDatabase } from '../src/config/database';
import { MovieModel } from '../src/models/entity.model';
import * as storage from '../src/storage/entity';
import { clearMovieCollection, connectTestDb, disconnectTestDb } from './setup';

const film1 = {
  title: 'Film One',
  releaseYear: 2010,
  genre: 'sci-fi' as const,
  director: 'Director A',
};

const film2 = {
  title: 'Film Two',
  releaseYear: 1972,
  genre: 'drama' as const,
  director: 'Director B',
};

const film3 = {
  title: 'Film Three',
  releaseYear: new Date().getFullYear(),
  genre: 'sci-fi' as const,
  director: 'Director C',
};

/** Valid ObjectId hex that is unlikely to exist after collection clears. */
const missingId = '507f1f77bcf86cd799439011';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearMovieCollection();
});

describe('Movie model', () => {
  it('sets createdAt and updatedAt on create', async () => {
    const doc = await MovieModel.create(film1);
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });

  it('exposes displayTitle virtual in JSON', async () => {
    const doc = await MovieModel.create(film1);
    const json = doc.toJSON() as unknown as { displayTitle: string; title: string; releaseYear: number };
    expect(json.displayTitle).toBe(`${film1.title} (${film1.releaseYear})`);
  });

  it('maps _id to id in JSON', async () => {
    const doc = await MovieModel.create(film1);
    const json = doc.toJSON() as unknown as { id: string; _id?: unknown };
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
  });

  it('maps id in toObject output', async () => {
    const doc = await MovieModel.create(film1);
    const obj = doc.toObject() as unknown as { id: string; _id?: unknown };
    expect(obj.id).toBeDefined();
    expect(obj._id).toBeUndefined();
  });

  it('rejects title without letters', async () => {
    await expect(
      MovieModel.create({
        title: '12345',
        releaseYear: 2020,
        genre: 'drama',
        director: 'Someone',
      }),
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('rejects invalid genre', async () => {
    await expect(
      MovieModel.create({
        title: 'Valid Title',
        releaseYear: 2020,
        genre: 'not-a-genre',
        director: 'Someone',
      }),
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('rejects releaseYear above allowed max', async () => {
    const farFuture = new Date().getFullYear() + 10;
    await expect(
      MovieModel.create({
        title: 'Future',
        releaseYear: farFuture,
        genre: 'sci-fi',
        director: 'Bot',
      }),
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });
});

describe('movies api', () => {
  describe('POST /api/movies', () => {
    it('should return 201', async () => {
      const res = await request(app).post('/api/movies').send(film1).expect(201);

      expect(res.body.title).toBe(film1.title);
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.displayTitle).toBe(`${film1.title} (${film1.releaseYear})`);
    });

    it('should return 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({ title: '', releaseYear: 1800, genre: 'unknown', director: '' })
        .expect(400);

      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when Mongoose rejects title without letters', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({
          title: '99999',
          releaseYear: 2020,
          genre: 'drama',
          director: 'X',
        })
        .expect(400);

      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/movies', () => {
    it('returns empty data and zero totalPages when there are no movies', async () => {
      const res = await request(app).get('/api/movies').expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
      expect(res.body.pagination.totalPages).toBe(0);
    });

    it('should return all items with pagination', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').expect(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.totalPages).toBe(1);
    });

    it('should filter by genre', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').query({ genre: 'drama' }).expect(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Film Two');
    });

    it('should filter by minYear', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').query({ minYear: 2000 }).expect(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Film One');
    });

    it('should filter by maxYear', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film3);

      const res = await request(app).get('/api/movies').query({ maxYear: 2015 }).expect(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Film One');
    });

    it('should filter by genre and minYear', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film3);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app)
        .get('/api/movies')
        .query({ genre: 'sci-fi', minYear: 2015 })
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Film Three');
    });

    it('should return 400 for invalid query', async () => {
      const res = await request(app).get('/api/movies').query({ genre: 'invalid' }).expect(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid sort parameter', async () => {
      const res = await request(app).get('/api/movies').query({ sort: 'rating' }).expect(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should sort by title ascending', async () => {
      await request(app).post('/api/movies').send(film2);
      await request(app).post('/api/movies').send(film1);

      const res = await request(app).get('/api/movies').query({ sort: 'title' }).expect(200);
      expect(res.body.data.map((m: { title: string }) => m.title)).toEqual(['Film One', 'Film Two']);
    });

    it('should sort by releaseYear descending', async () => {
      await request(app).post('/api/movies').send(film2);
      await request(app).post('/api/movies').send(film1);

      const res = await request(app).get('/api/movies').query({ sort: '-releaseYear' }).expect(200);
      expect(res.body.data[0].releaseYear).toBeGreaterThanOrEqual(res.body.data[1].releaseYear);
    });

    it('should filter by title case-insensitive', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').query({ title: 'one' }).expect(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Film One');
    });

    it('escapes regex metacharacters in title filter', async () => {
      await request(app)
        .post('/api/movies')
        .send({
          title: 'Matrix (1999)',
          releaseYear: 1999,
          genre: 'sci-fi',
          director: 'Wachowskis',
        });
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').query({ title: '(' }).expect(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Matrix (1999)');
    });

    it('should paginate with page and limit', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);
      await request(app).post('/api/movies').send(film3);

      const res = await request(app).get('/api/movies').query({ page: 2, limit: 2 }).expect(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/movies/recent', () => {
    it('should return items from last 5 years', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film3);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies/recent').expect(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Film Three');
    });

    it('returns 500 when storage fails', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(storage, 'getRecent').mockRejectedValueOnce(new Error('db'));
      const res = await request(app).get('/api/movies/recent').expect(500);
      expect(res.body.error).toBe('Internal server error');
      errSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return item by id', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      const res = await request(app).get(`/api/movies/${created.body.id}`).expect(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it('should return 404 for valid ObjectId that does not exist', async () => {
      const res = await request(app).get(`/api/movies/${missingId}`).expect(404);
      expect(res.body.error).toBe('Not found');
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).get('/api/movies/not-an-objectid').expect(400);
      expect(res.body.error).toBe('Invalid id');
    });
  });

  describe('PATCH /api/movies/:id', () => {
    it('should return 200', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      const res = await request(app)
        .patch(`/api/movies/${created.body.id}`)
        .send({ title: 'Film One Updated' })
        .expect(200);

      expect(res.body.title).toBe('Film One Updated');
    });

    it('should return 404 for missing document', async () => {
      await request(app).patch(`/api/movies/${missingId}`).send({ title: 'X' }).expect(404);
    });

    it('should return 400 for invalid id format', async () => {
      await request(app).patch('/api/movies/bad-id').send({ title: 'X' }).expect(400);
    });

    it('should return 400 for invalid body', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      const res = await request(app)
        .patch(`/api/movies/${created.body.id}`)
        .send({ releaseYear: 1700 })
        .expect(400);

      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 when Mongoose validation fails on update', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      await request(app)
        .patch(`/api/movies/${created.body.id}`)
        .send({ title: '0000' })
        .expect(400);
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should return 204', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      await request(app).delete(`/api/movies/${created.body.id}`).expect(204);
      await request(app).get(`/api/movies/${created.body.id}`).expect(404);
    });

    it('should return 404 for missing document', async () => {
      await request(app).delete(`/api/movies/${missingId}`).expect(404);
    });

    it('should return 400 for invalid id format', async () => {
      await request(app).delete('/api/movies/!!!').expect(400);
    });
  });
});

describe('connectDatabase', () => {
  it('throws when MONGODB_URI is not set', async () => {
    const prev = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    await expect(connectDatabase()).rejects.toThrow('MONGODB_URI');
    process.env.MONGODB_URI = prev;
  });

  it('throws when MONGODB_URI is only whitespace', async () => {
    const prev = process.env.MONGODB_URI;
    process.env.MONGODB_URI = '   ';
    await expect(connectDatabase()).rejects.toThrow('MONGODB_URI');
    process.env.MONGODB_URI = prev;
  });

  it('logs MongoDB connection errors', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mongoose.connection.emit('error', new Error('simulated'));
    expect(spy).toHaveBeenCalledWith('MongoDB connection error:', expect.any(Error));
    spy.mockRestore();
  });

  it('warns on disconnect outside test environment', () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mongoose.connection.emit('disconnected');
    expect(spy).toHaveBeenCalledWith('MongoDB disconnected');
    spy.mockRestore();
    process.env.NODE_ENV = prevEnv;
  });
});
