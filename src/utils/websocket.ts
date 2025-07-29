import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

// Initialize the WebSocket server instance
export const initializeWebSocket = (socketServer: SocketIOServer) => {
  io = socketServer;
};

// Get the WebSocket server instance
export const getIO = () => {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
};

// Broadcast to all connected clients
export const broadcastToAll = (event: string, data: any) => {
  const socketIO = getIO();
  socketIO.emit(event, data);
};

// Broadcast to a specific room
export const broadcastToRoom = (room: string, event: string, data: any) => {
  const socketIO = getIO();
  socketIO.to(room).emit(event, data);
};

// Broadcast to a specific user
export const broadcastToUser = (userId: string, event: string, data: any) => {
  const socketIO = getIO();
  socketIO.to(userId).emit(event, data);
};

// Broadcast business updates
export const broadcastBusinessUpdate = (businessId: string, update: any) => {
  broadcastToRoom(`business-${businessId}`, 'business-updated', {
    businessId,
    update,
    timestamp: new Date()
  });
};

// Broadcast new message
export const broadcastNewMessage = (businessId: string, message: any) => {
  broadcastToRoom(`business-${businessId}`, 'message-created', {
    message,
    timestamp: new Date()
  });
};

// Broadcast message status update
export const broadcastMessageStatusUpdate = (businessId: string, messageId: string, status: string) => {
  broadcastToRoom(`business-${businessId}`, 'message-status-updated', {
    messageId,
    status,
    timestamp: new Date()
  });
};

// Broadcast user status change
export const broadcastUserStatus = (userId: string, status: 'online' | 'offline') => {
  broadcastToAll('user-status-changed', {
    userId,
    status,
    timestamp: new Date()
  });
};

// Get connected users count
export const getConnectedUsersCount = () => {
  const socketIO = getIO();
  return socketIO.engine.clientsCount;
};

// Get users in a specific room
export const getUsersInRoom = (room: string) => {
  const socketIO = getIO();
  const roomSockets = socketIO.sockets.adapter.rooms.get(room);
  return roomSockets ? Array.from(roomSockets) : [];
}; 