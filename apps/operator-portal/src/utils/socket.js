import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  if (!socket) {
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000';
    socket = io(gatewayUrl, {
      auth: { token: localStorage.getItem('cs_token') },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 5000,
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })
    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error (backend may be offline):', err.message)
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
