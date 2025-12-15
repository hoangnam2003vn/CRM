import React from 'react';

const AuthTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="auth-tabs">
      <button 
        className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
        onClick={() => setActiveTab('login')}
      >
        Login
      </button>
      <button 
        className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
        onClick={() => setActiveTab('register')}
      >
        Register
      </button>
      <button 
        className={`tab-button ${activeTab === 'forgot' ? 'active' : ''}`}
        onClick={() => setActiveTab('forgot')}
      >
        Forgot
      </button>
    </div>
  );
};

export default AuthTabs;