import React, { useState } from 'react';
import OAuth2Login from './OAuth2Login';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = (e) => {
    e.preventDefault();

    // Kiểm tra tính hợp lệ của email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }

    setError('');
    // Xử lý quên mật khẩu tại đây
    console.log("Forgot Password:", { email });
    alert("Mã xác minh đã được gửi tới email của bạn.");
  };

  return (
    <div>
      <form onSubmit={handleForgotPassword} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="login-button">
          Gửi mã xác minh
        </button>
      </form>
      
      <OAuth2Login />
    </div>
  );
};

export default ForgotPasswordForm;