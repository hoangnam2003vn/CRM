import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPassword from './ResetPassword';
import AuthTabs from './AuthTabs';
import SecureAuthentication from './SecureAuthentication';
import logo from '../assets/logo.png';
import '../App.css';

const LoginLayout = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [isResetPassword, setIsResetPassword] = useState(false);

    const renderForm = () => {
        if (isResetPassword) return <ResetPassword key="reset" />;
        switch (activeTab) {
            case 'login': return <LoginForm key="login" />;
            case 'register': return <RegisterForm key="register" />;
            case 'forgot': return <ForgotPasswordForm key="forgot" setIsResetPassword={setIsResetPassword} />;
            default: return <LoginForm key="default" />;
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-content">
                <div className="form-container">
                    <div className="logo-container">
                        <img src={logo} alt="CRM Logo" className="logo" />
                    </div>
                    <h2 className="welcome-text">Welcome Back</h2>
                    <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                    <div className="form-wrapper">
                        {renderForm()}
                    </div>
                </div>
                <div className="secure-auth-panel">
                    <SecureAuthentication />
                </div>
            </div>
        </div>
    );
};

export default LoginLayout;