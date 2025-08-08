import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session'; // Import express-session
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './auth/login';
import roleRouter from './roles-and-permissions/role';
import editRoleRouter from './roles-and-permissions/edit-roles';
import userRouter from './users/users';
import createUserRouter from './users/createUser';
import userProfileRouter from './auth/fetch-profile';
import userDevicesRouter from './auth/user-devices/add-device';
import checkSessionRouter from './auth/check-session';
import logoutRouter from './auth/logout';
import cookieParser from 'cookie-parser';
import createBusiness from './business/createBusiness'
import updateBusiness from './business/updateBusiness'
import deleteBusiness from './business/deleteBusiness'
import updateBusinessVerificationStatus from './business/updateVerificationStatus'
import businessRoutes from './business/businesses'
import createTagline from './tagline-category/createTagline'
import taglines from './tagline-category/taglines'
import updateTagline from './tagline-category/updateTagline'
import deleteTagline from './tagline-category/deleteTagline'
import createMessage from './message/createMessage'
import messages from './message/messages'
import updateMessage from './message/updateMessage'
import deleteMessage from './message/deleteMessage'
import updateMessageStatus from './message/updateMessageStatus'
import emailAndPassSignup from './auth/signup-email-and-pass/signup'
import activitiesRouter from './activities/activities'
import postingRouter from './posting/posting'
import { initializeWebSocket, getIO } from './utils/websocket';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }
});

// Initialize WebSocket utility
initializeWebSocket(io);

const port = process.env.PORT || 3200;

// Configure express-session. 
// Replace 'your-secret-key' with a strong, secure secret (or store it in an environment variable).
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set secure to true if using HTTPS make this tru when production
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for file attachments
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For form data
app.use(cookieParser());

app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email'],
  })
);

app.options('*', cors());

// Mount auth routes under /auth
app.use('/auth', authRouter);


// signup for email and password only
app.use('/auth/signup', emailAndPassSignup);


app.use('/auth/check-session', checkSessionRouter); // Check session endpoint
app.use('/auth/logout', logoutRouter); // Logout endpoint
app.use('/roles', roleRouter);
app.use('/roles/editRole', editRoleRouter);
app.use('/users', userRouter);
app.use('/users/create', createUserRouter);
app.use('/user/devices', userDevicesRouter);
app.use('/user/profile', userProfileRouter);

// business 
app.use('/businesses', businessRoutes)
app.use('/businesses/create', createBusiness)
app.use('/businesses/update', updateBusiness)
app.use('/businesses/delete', deleteBusiness)
app.use('/businesses/verify', updateBusinessVerificationStatus)

// tagline category @relation to business
app.use('/taglines/create', createTagline)
app.use('/taglines', taglines)
app.use('/taglines/update', updateTagline)
app.use('/taglines/delete', deleteTagline)
// messages
app.use('/messages/create', createMessage)
app.use('/messages', messages)
app.use('/messages/update', updateMessage)
app.use('/messages/delete', deleteMessage)
app.use('/messages/status', updateMessageStatus)

// activities
app.use('/activities', activitiesRouter)

// postings
app.use('/postings', postingRouter)


// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user authentication and join their personal room
  socket.on('authenticate', (data) => {
    console.log('Backend received authentication:', data);
    const { userId, userEmail } = data;
    if (userId) {
      // Join user's personal room for receiving messages
      socket.join(userId);
      console.log(`User ${userId} (${userEmail}) authenticated and joined room: ${userId}`);
      console.log('Current socket rooms:', Array.from(socket.rooms));
      
      // Send a test message to confirm connection
      socket.emit('test-message', {
        message: 'WebSocket connection established successfully!',
        timestamp: new Date()
      });
    }
  });

  // Handle ping for testing connection
  socket.on('ping', () => {
    console.log('Received ping from client');
    socket.emit('pong', { timestamp: new Date() });
  });

  // Handle user joining a room (e.g., for business-specific messages)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Handle user leaving a room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  // Handle private messages
  socket.on('private-message', (data) => {
    const { recipientId, message } = data;
    socket.to(recipientId).emit('private-message', {
      senderId: socket.id,
      message: message,
      timestamp: new Date()
    });
  });

  // Handle business updates
  socket.on('business-update', (data) => {
    const { businessId, update } = data;
    socket.to(`business-${businessId}`).emit('business-updated', {
      businessId,
      update,
      timestamp: new Date()
    });
  });

  // Handle message creation (business-based)
  socket.on('new-message', (data) => {
    const { businessId, message } = data;
    socket.to(`business-${businessId}`).emit('message-created', {
      message,
      timestamp: new Date()
    });
  });

  // Handle user-to-user message sending
  socket.on('send-message', (data) => {
    console.log('Backend received send-message event:', data);
    const { message, receiverId } = data;
    // Broadcast to both sender and receiver using global io
    const socketIO = getIO();
    socketIO.to(receiverId).emit('message-created', {
      message,
      timestamp: new Date()
    });
    console.log(`Broadcasting message to user: ${receiverId}`);
  });

  // Handle message deletion
  socket.on('delete-message', (data) => {
    console.log('Backend received delete-message event:', data);
    const { messageId, senderId, receiverId } = data;
    // Broadcast deletion to both users using global io
    const socketIO = getIO();
    const targetUsers = [senderId, receiverId];
    targetUsers.forEach(userId => {
      socketIO.to(userId).emit('message-deleted', {
        messageId,
        timestamp: new Date()
      });
    });
    console.log(`Broadcasting message deletion to users: ${targetUsers.join(', ')}`);
  });

  // Handle message status updates
  socket.on('update-message-status', (data) => {
    console.log('Backend received update-message-status event:', data);
    const { messageId, status, senderId, receiverId } = data;
    // Broadcast status update to both users using global io
    const socketIO = getIO();
    const targetUsers = [senderId, receiverId];
    targetUsers.forEach(userId => {
      socketIO.to(userId).emit('message-status-updated', {
        messageId,
        status,
        timestamp: new Date()
      });
    });
    console.log(`Broadcasting status update to users: ${targetUsers.join(', ')}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Change from app.listen to server.listen
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket server is ready for connections`);
});
