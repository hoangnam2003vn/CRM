import React, { useState } from 'react';
import OAuth2Login from './OAuth2Login';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    
    if (password === confirmPassword) {
      // Xử lý đăng ký tại đây
      console.log("Register:", { username, password });
    } else {
      setError("Passwords do not match");
    }
  };

  return (
    <div>
      <form onSubmit={handleRegister} className="auth-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <input
            type="email"
            placeholder="Enter email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={error ? "input-error" : ""}
          />
        </div>
        
        <button type="submit" className="login-button">
          Register
        </button>
      </form>
      
      <OAuth2Login />
    </div>
  );
};

export default RegisterForm;