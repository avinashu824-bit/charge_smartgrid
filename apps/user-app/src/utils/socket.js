import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 5000
    });
    socket.on('connect', () => console.log('[Socket] Connected to ChargeSmart Gateway'));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    socket.on('connect_error', () => console.log('[Socket] Gateway offline — using mock data'));
  }
  return socket;
}

export default getSocket;
