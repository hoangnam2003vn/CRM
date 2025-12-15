import React, { useState } from 'react';
import OAuth2Login from './OAuth2Login';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Đăng nhập thất bại');
      } else {
        // Lưu token
        localStorage.setItem('token', data.token);

        // Lưu thông tin người dùng
        if (data.user) {
          localStorage.setItem('userInfo', JSON.stringify({
            name: data.user.name || email.split('@')[0],
            email: data.user.email || email,
            role: data.user.role || 'User'
          }));
        } else {
          localStorage.setItem('userInfo', JSON.stringify({
            name: email.split('@')[0],
            email: email,
            role: 'User'
          }));
        }

        // Chuyển hướng đến trang dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Có lỗi khi đăng nhập');
      console.error(err);
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
      
      <OAuth2Login />
    </div>
  );
};

export default LoginForm;