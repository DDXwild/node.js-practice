import { MongoServerError } from 'mongodb';
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: 'Invalid id',
      message: err.message,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => ({
        path: e.path,
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({
      error: 'Conflict',
      message: 'Duplicate key',
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
}
