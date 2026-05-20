import request from 'supertest';
import app from '../src/app';
import { connectTestDb, disconnectTestDb } from './setup';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe('GET /health', () => {
  it('returns 200 when MongoDB is connected', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      database: { connected: true, readyState: 1 },
    });
  });
});
