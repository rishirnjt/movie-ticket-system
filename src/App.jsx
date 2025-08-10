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
import AuthModal from "./components/AuthModel";

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
        <Route
          path="/"
          element={
            <>
              <Carousel />
              <NowShowing />
              <ComingSoon />
            </>
          }
        />
        <Route path="/seats/:movieId" element={<SeatSelection />} />
         <Route
          path="/auth"
          element={
            <AuthModal
              setIsLoggedIn={setIsLoggedIn}
              onClose={() => window.history.back()}
            />
          }
        />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/add-movie" element={<AddMovie />} />
        <Route path="/ticket-rates" element={<TicketRates />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
