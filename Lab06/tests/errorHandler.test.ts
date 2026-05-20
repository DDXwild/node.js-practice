import type { NextFunction, Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import mongoose from 'mongoose';
import { z } from 'zod';
import { errorHandler } from '../src/middleware/errorHandler';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 for ZodError', () => {
    const res = mockRes();
    const err = z.object({ x: z.string() }).safeParse({}).error!;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation failed', details: expect.any(Array) }),
    );
  });

  it('returns 400 for CastError', () => {
    const res = mockRes();
    const err = new mongoose.Error.CastError('ObjectId', 'bad', '_id');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid id', message: expect.any(String) }),
    );
  });

  it('returns 400 for Mongoose ValidationError', () => {
    const res = mockRes();
    const err = new mongoose.Error.ValidationError();
    err.addError('title', new mongoose.Error.ValidatorError({ message: 'bad', path: 'title' }));
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.arrayContaining([expect.objectContaining({ path: 'title' })]),
      }),
    );
  });

  it('returns 409 for duplicate key (code 11000)', () => {
    const res = mockRes();
    const err = new MongoServerError({ message: 'duplicate', code: 11000 });
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Conflict', message: 'Duplicate key' }),
    );
  });

  it('returns 500 for unexpected errors', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Internal server error', message: 'boom' }),
    );
  });
});
