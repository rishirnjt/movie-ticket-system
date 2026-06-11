# 🎬 Movie Ticket Booking System

A full-stack movie ticket booking web application built using the MERN stack. It allows users to browse movies, view details, book tickets, and buy food, while admins manage movies and schedules.

---

## 🚀 Features

### 👤 User Side
- Browse available movies
- View movie details
- Select show timings
- Book tickets
- Buy food items
- View booking confirmation

### 🛠️ Admin Side
- Add / update / delete movies
- Manage show timings
- Control movie listings
- View bookings

---

## 🧑‍💻 Tech Stack

### Frontend
- React.js
- CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Tools & Services
- Git & GitHub
- Postman
- JWT Authentication
- Docker

---

## 📁 Project Structure

```text
client/
 └── src/
     ├── components/
     ├── pages/
     └── services/

server/
 ├── models/
 ├── routes/
 ├── controllers/
 └── middleware/
```
🐳 Docker Deployment

This project is fully containerized using Docker and Docker Compose.

📦 Services
Frontend (React)
Backend (Node.js + Express)
Database (MongoDB)
🚀 Run Project with Docker

Build and start containers:

docker-compose up --build

Run in background:

docker-compose up -d

Stop containers:

docker-compose down
⚙️ Environment Variables

Create a .env file inside the server/ directory:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
📌 API Overview
Auth Routes
POST /api/auth/register
POST /api/auth/login
Movie Routes
GET /api/movies
POST /api/movies
PUT /api/movies/:id
DELETE /api/movies/:id
Booking Routes
POST /api/bookings
GET /api/bookings
⭐ Project Highlights
Full-stack MERN architecture
Role-based system (User & Admin)
RESTful API design
Dockerized deployment setup
Modular and scalable backend structure
Real-world booking logic implementation
🧠 What I Learned
Building full-stack MERN applications
API design and integration
Authentication using JWT
Docker containerization
Structuring scalable backend systems
