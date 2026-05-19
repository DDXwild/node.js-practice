import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    throw new Error('MONGODB_URI is not set');
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('MongoDB disconnected');
    }
  });

  await mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
}
