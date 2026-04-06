const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(httpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Không có token'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user && socket.user.role === 'admin') {
      socket.join('admin:attendance');
    }
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO chưa khởi tạo');
  }
  return io;
}

module.exports = { initSocket, getIO };
