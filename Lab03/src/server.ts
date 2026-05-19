import type { AddressInfo } from 'net';
import app from './app';

const preferredPort = process.env.PORT !== undefined ? Number(process.env.PORT) : 0;

if (Number.isNaN(preferredPort) || preferredPort < 0) {
  console.error('Invalid PORT');
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
