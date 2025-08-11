const express = require('express');
const cors = require('cors');

const app = express();
const port = 3200;

// Basic CORS setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email'],
}));

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Express with TypeScript!');
});

// Test upload route
app.post('/businesses/upload-images/profile-picture/:id', (req, res) => {
  console.log('Received upload request for business:', req.params.id);
  console.log('Request body size:', JSON.stringify(req.body).length);
  
  res.json({
    message: 'Profile picture updated successfully (test)',
    organization: {
      id: req.params.id,
      profilePicture: req.body.profilePicture ? 'data:image/...' : null
    }
  });
});

app.listen(port, () => {
  console.log(`Test server is running on port ${port}`);
  console.log('This is a test server without database to check CORS and payload issues');
});
