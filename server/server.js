require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/error.middleware');
const { setIO } = require('./utils/socketIO');

const app = express();
const server = http.createServer(app);

// Socket.IO Init
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.set('io', io); // Make io accessible in routes/controllers
setIO(io);         // Also expose via singleton for controllers

// Connect to MongoDB
connectDB();

// Bootstrap Bull job queue (order deadline auto-cancel)
require('./jobs/orderDeadline.job');

// Security and utility middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(compression());

// Rate Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// ⚠️  Webhook route MUST be mounted before express.json() so it receives the
// raw Buffer body needed for Razorpay HMAC signature verification
app.use('/api/webhooks', require('./routes/webhook.routes'));

app.use(express.json());
app.use(cookieParser());

// Mount Routes
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/gigs', require('./routes/gig.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/wallet', require('./routes/wallet.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/milestones', require('./routes/milestone.routes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
}

// Global Error Handler (must be after routes)
app.use(errorHandler);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});