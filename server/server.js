
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');
// const connectDB = require('./config/db');

// dotenv.config();
// const app = express();

// app.use(cors());

// // Parse JSON requests
// app.use(express.json());

// // Static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Connect to MongoDB
// connectDB();
// const mongoose = require("mongoose");
// mongoose.connection.once("open", () => {
//   console.log("Connected to database:", mongoose.connection.name);
// });


// // Register models
// require("./models/Showtime");
// require("./models/Movie");
// require("./models/Booking");
// require("./models/User");
// require("./models/Ticket");
// require("./models/UserType");

// // Routes
// app.use('/api/movies', require('./routes/movieRoutes'));
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/upload', require('./routes/uploadRoutes'));
// app.use('/api/bookings', require('./routes/bookingRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/foods', require('./routes/foodRoutes'));
// app.use('/api/tickets', require('./routes/ticketRoutes'));
// // app.use("/api/email", require("./routes/emailRoutes"));



// // Test route
// app.get('/test', (req, res) => {
//   res.send('Server and routes are working fine');
// });

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(` Server running on http://localhost:${PORT}`);
// });


// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

dotenv.config();
const app = express();

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json()); // parse JSON

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------
// Connect to MongoDB
// --------------------
connectDB();
mongoose.connection.once('open', () => {
  console.log('Connected to database:', mongoose.connection.name);
});

// --------------------
// Register Models
// --------------------
require('./models/Showtime');
require('./models/Movie');
require('./models/Booking');
require('./models/User');
require('./models/Ticket');
require('./models/UserType');

// --------------------
// Routes
// --------------------
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const foodRoutes = require('./routes/foodRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

app.use('/api/movies', movieRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/tickets', ticketRoutes);
app.use("/api/users", userRoutes);

// --------------------
// Test route
// --------------------
app.get('/test', (req, res) => {
  res.send('Server and routes are working fine');
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
