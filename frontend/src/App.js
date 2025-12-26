import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import 'bootstrap/dist/css/bootstrap.min.css';

// Configure axios
axios.defaults.baseURL = 'http://localhost:5000';
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <a className="navbar-brand" href="/">
              <i className="fas fa-ticket-alt me-2"></i>
              Ticket System
            </a>
            {isAuthenticated && (
              <div className="d-flex align-items-center">
                <span className="text-light me-3">
                  Welcome, {user?.name} ({user?.role})
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="container mt-4">
          <Routes>
            <Route path="/login" element={
              !isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
            } />
            <Route path="/" element={
              isAuthenticated ? <TicketList user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/create-ticket" element={
              isAuthenticated ? <TicketForm user={user} /> : <Navigate to="/login" />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;