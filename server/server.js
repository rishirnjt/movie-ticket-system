const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Initialization
dotenv.config();
const app = express();

// Connect to Mongo
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const movieRoutes = require('./routes/movieRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/movies', movieRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes)
app.use('/api/upload', uploadRoutes); 

app.get('/', (req, res) => {
    res.send('API is running....');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
