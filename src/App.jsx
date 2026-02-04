import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Carousel from "./components/Carousel";
import NowShowing from "./components/NowShowing";
import ComingSoon from "./components/ComingSoon";
import Footer from "./components/Footer";
import SeatSelection from "./components/SeatSelection";
import Dashboard from "./components/Dashboard";
import TicketRates from "./components/TicketRates";
import AddMovie from "./components/AddMovie";
import EditMovie from "./components/EditMovie";
import ManageMovies from "./components/ManageMovies";
import AuthModal from "./components/AuthModel";
import MyAccount from "./components/MyAccount";
import Foods from "./components/Foods";
import Checkout from "./components/Checkout";
import AdminFoods from "./components/AdminFood";
import AdminRoutes from "./components/AdminRoutes";

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<><Carousel /><NowShowing /><ComingSoon /></>} />
        <Route path="/seats/:movieId" element={<SeatSelection />} />
        <Route path="/foods/:bookingId" element={<Foods />} />
        <Route path="/checkout/:bookingId" element={<Checkout />} />
        <Route path="/ticket-rates" element={<TicketRates />} />
        <Route path="/myaccount" element={<MyAccount />} />

        {/* Authentication */}
        <Route 
          path="/auth"
          element={
            <AuthModal
              setIsLoggedIn={setIsLoggedIn}
              onClose={() => window.history.back()}
            />
          }
        />

        {/* Admin Protected Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoutes>
              <Dashboard />
            </AdminRoutes>
          } 
        />

        <Route 
          path="/admin/add-movie" 
          element={
            <AdminRoutes>
              <AddMovie />
            </AdminRoutes>
          } 
        />
         <Route 
          path="/admin/manage-movies" 
          element={
            <AdminRoutes>
              <ManageMovies />
            </AdminRoutes>
          } 
        />
        <Route 
          path="/admin/edit-movie/:id" 
          element={
            <AdminRoutes>
              <EditMovie />
            </AdminRoutes>
          } 
        />


        <Route 
          path="/admin/foods" 
          element={
            <AdminRoutes>
              <AdminFoods />
            </AdminRoutes>
          } 
        />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
