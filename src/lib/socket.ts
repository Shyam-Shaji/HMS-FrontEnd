import {io, type Socket} from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

// Connects to the backend's /queue namespace (see
// appointments/appointments.gateway.ts in hms-backend) for live token/
// queue updates. One socket per mount of useQueue - created lazily rather
// than as a module-level singleton, since different screens (waiting-room
// board vs a single patient's status view) join different rooms.
export function createQueueSocket(): Socket {
  return io(`${SOCKET_URL}/queue`, { autoConnect: true, transports: ['websocket'] });
}
