import React, { useState } from "react";
import './Register.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const Register = ({ onClose, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        countryCode: "+977",
        phone:"",
        email:"",
        dob:"",
        firstName:"",
        lastName:"",
        password:"",
        termsAccepted: false,
    });

    const navigate = useNavigate();
  
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleRegister = async () => {
        if(!formData.termsAccepted){
            alert("You must agree to Terms & Conditions");
            return;
        }

        try{
            const res = await axios.post("http://localhost:5000/api/admin/register", formData);
            alert("Registration successful!");
            onClose();
            navigate("/admin/dashboard");
        } catch(err){
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="register-overlay">
            <div className="register-box">
                <button className="close-btn" onClick={onClose}>X</button>
                <h2>SIGN UP</h2>

                <div className="form-group-inline">
                    <select name="countryCode" value={formData.countryCode} onChange={handleChange}>
                        <option value="+977">+977</option>
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                    </select>
                    <input 
                    type="text"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    />
                </div>

                <input 
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                />

                <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                />

                <div className="form-group-inline">
                    <input 
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    />
                    <input 
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    />
                </div>

                <div className="password-wrapper">
                    <input 
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    />
                </div>

                <label className="terms">
                    <input 
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleChange}
                    />{" "}
                    I agree to all <a href="#">Terms & Conditions</a>
                </label>

                <button className="confirm-btn" onClick={handleRegister}>Confirm</button>

                <p className="login-link">
                    Already have an account?{" "}
                    <span
                        onClick={onSwitchToLogin}
                        style={{color: "white", cursor: "pointer"}}                    
                    >
                        Login Here
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Register;