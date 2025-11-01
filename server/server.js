// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');
// const connectDB = require('./config/db');

// dotenv.config();
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Register models
// require("./models/Showtime");
// require("./models/Movie");
// require("./models/Booking");
// require("./models/User");

// // Middlewares
// app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // React dev server
// app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// app.use('/api/movies', require('./routes/movieRoutes'));
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/upload', require('./routes/uploadRoutes'));
// app.use('/api/bookings', require('./routes/bookingRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));

// // Test route
// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

app.use(cors());

// Parse JSON requests
app.use(express.json());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();
const mongoose = require("mongoose");
mongoose.connection.once("open", () => {
  console.log("Connected to database:", mongoose.connection.name);
});


// Register models
require("./models/Showtime");
require("./models/Movie");
require("./models/Booking");
require("./models/User");

// Routes
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Test route
app.get('/test', (req, res) => {
  res.send('Server and routes are working fine');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});


