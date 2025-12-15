import React from 'react';
import { FaLock, FaUserPlus, FaEnvelope } from 'react-icons/fa';

const SecureAuthentication = () => {
  return (
    <div className="secure-auth-content">
      <h2 className="secure-auth-title">Secure Authentication</h2>
      
      <div className="auth-feature">
        <div className="auth-feature-icon">
          <FaLock />
        </div>
        <div className="auth-feature-text">
          <h3>Secure by Design</h3>
          <p>Built with security best practices</p>
        </div>
      </div>
      
      <div className="auth-feature">
        <div className="auth-feature-icon">
          <FaUserPlus />
        </div>
        <div className="auth-feature-text">
          <h3>Easy Registration</h3>
          <p>Create an account in seconds</p>
        </div>
      </div>
      
      <div className="auth-feature">
        <div className="auth-feature-icon">
          <FaEnvelope />
        </div>
        <div className="auth-feature-text">
          <h3>Password Recovery</h3>
          <p>Never lose access to your account</p>
        </div>
      </div>
    </div>
  );
};

export default SecureAuthentication;