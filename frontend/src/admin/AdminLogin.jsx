import React, { useState } from 'react';
// import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './admin.css';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
const API = process.env.REACT_APP_API_URL || "http://localhost:5001";


  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
<<<<<<< HEAD
      const res = await axios.post('https://auction-system-llhe.onrender.com/api/admin/auth/login', form);
=======
const res = await axios.post(`${API}/api/admin/auth/login`, form);
>>>>>>> 260dcc506faf2995683598f685c31bd75a055976
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="admin-container">
      <main className="admin-main-content">
        <form className="admin-card" onSubmit={handleSubmit}>
          <h2>Admin Login</h2>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button type="submit">Login</button>
          <div style={{ marginTop: 10 }}>
            <a href="/admin/forgot-password">
              Forgot Password?
            </a>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
      </main>
    </div>
  );
}
