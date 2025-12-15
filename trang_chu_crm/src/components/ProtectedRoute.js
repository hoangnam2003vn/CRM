import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // DEMO MODE - Tắt kiểm tra authentication
    // Comment dòng này và uncomment phần dưới khi cần bật lại authentication
    return children;
    
    /* 
    // PRODUCTION MODE - Uncomment khi cần bật lại authentication
    const token = localStorage.getItem('token');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
    */
};

export default ProtectedRoute;