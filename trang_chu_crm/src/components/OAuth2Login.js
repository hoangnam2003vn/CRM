import React from 'react';
import { FaGoogle, FaFacebook, FaGithub } from 'react-icons/fa';

const OAuth2Login = () => {
  const handleGoogleLogin = () => {
    // URL OAuth2 của Google
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleFacebookLogin = () => {
    // URL OAuth2 của Facebook
    window.location.href = 'http://localhost:5000/api/auth/facebook';
  };

  const handleGithubLogin = () => {
    // URL OAuth2 của GitHub
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  return (
    <div className="oauth2-container">
      <div className="oauth2-divider">
        <span className="divider-line"></span>
        <span className="divider-text">Or continue with</span>
        <span className="divider-line"></span>
      </div>

      <div className="oauth2-buttons">
        <button 
          type="button" 
          className="oauth2-button google-button"
          onClick={handleGoogleLogin}
        >
          <FaGoogle className="oauth2-icon" />
          <span>Google</span>
        </button>

        <button 
          type="button" 
          className="oauth2-button facebook-button"
          onClick={handleFacebookLogin}
        >
          <FaFacebook className="oauth2-icon" />
          <span>Facebook</span>
        </button>

        <button 
          type="button" 
          className="oauth2-button github-button"
          onClick={handleGithubLogin}
        >
          <FaGithub className="oauth2-icon" />
          <span>GitHub</span>
        </button>
      </div>
    </div>
  );
};

export default OAuth2Login;