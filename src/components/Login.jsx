import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onClose, setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', {
        email,
        password,
      });

      // Save token + user info
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      setIsLoggedIn(true);

      // Close login modal and navigate
      onClose();
      navigate('/admin/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <button className="close-btn" onClick={onClose}>X</button>
        <h2>LOGIN</h2>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="go-btn" onClick={handleLogin}>GO</button>
        <a href="#" className="forgot-link">Forgot Your Password?</a>
      </div>
    </div>
  );
};

export default Login;
