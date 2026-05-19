import 'dotenv/config';
import type { AddressInfo } from 'net';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const preferredPort =
  process.env.PORT !== undefined && process.env.PORT !== '' ? Number(process.env.PORT) : 3000;

if (Number.isNaN(preferredPort) || preferredPort < 0) {
  console.error('Invalid PORT');
  process.exit(1);
}

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }

  const server = app.listen(preferredPort);

  server.on('listening', () => {
    const { port } = server.address() as AddressInfo;
    console.log(`http://localhost:${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && process.env.PORT !== undefined) {
      console.error(`Port ${preferredPort} is already in use`);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  });

  const shutdown = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
