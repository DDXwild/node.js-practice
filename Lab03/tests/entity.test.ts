import request from 'supertest';
import app from '../src/app';
import * as storage from '../src/storage/entity';

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

const missingId = '00000000-0000-0000-0000-000000000000';

describe('movies api', () => {
  beforeEach(() => {
    storage.reset();
  });

  describe('POST /api/movies', () => {
    it('should return 201', async () => {
      const res = await request(app).post('/api/movies').send(film1).expect(201);

      expect(res.body.title).toBe(film1.title);
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    it('should return 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({ title: '', releaseYear: 1800, genre: 'unknown', director: '' })
        .expect(400);

      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/movies', () => {
    it('should return all items', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').expect(200);
      expect(res.body.length).toBe(2);
    });

    it('should filter by genre', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').query({ genre: 'drama' }).expect(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Film Two');
    });

    it('should filter by minYear', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app).get('/api/movies').query({ minYear: 2000 }).expect(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Film One');
    });

    it('should filter by genre and minYear', async () => {
      await request(app).post('/api/movies').send(film1);
      await request(app).post('/api/movies').send(film3);
      await request(app).post('/api/movies').send(film2);

      const res = await request(app)
        .get('/api/movies')
        .query({ genre: 'sci-fi', minYear: 2015 })
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Film Three');
    });

    it('should return 400 for invalid query', async () => {
      const res = await request(app).get('/api/movies').query({ genre: 'invalid' }).expect(400);
      expect(res.body.error).toBe('Validation failed');
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
  });

  describe('GET /api/movies/:id', () => {
    it('should return item by id', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      const res = await request(app).get(`/api/movies/${created.body.id}`).expect(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it('should return 404', async () => {
      const res = await request(app).get(`/api/movies/${missingId}`).expect(404);
      expect(res.body.error).toBe('Not found');
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

    it('should return 404', async () => {
      await request(app)
        .patch(`/api/movies/${missingId}`)
        .send({ title: 'X' })
        .expect(404);
    });

    it('should return 400 for invalid body', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      const res = await request(app)
        .patch(`/api/movies/${created.body.id}`)
        .send({ releaseYear: 1700 })
        .expect(400);

      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should return 204', async () => {
      const created = await request(app).post('/api/movies').send(film1);
      await request(app).delete(`/api/movies/${created.body.id}`).expect(204);
      await request(app).get(`/api/movies/${created.body.id}`).expect(404);
    });

    it('should return 404', async () => {
      await request(app).delete(`/api/movies/${missingId}`).expect(404);
    });
  });
});
