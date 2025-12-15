import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Avatar,
  Typography,
  styled,
  Tooltip
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Dashboard,
  People,
  Description,
  Assessment,
  AttachMoney,
  Report,
  Settings,
  Logout,
  Inventory,
  Assignment,
  AccountBalance,
  Psychology,
  SmartToy,
  TrendingDown
} from '@mui/icons-material';
import logo from '../assets/logo.png';

// Styled components với màu xanh nước biển
const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 280,
  background: 'linear-gradient(180deg, #0a4d68 0%, #05668d 50%, #088395 100%)',
  color: '#fff',
  minHeight: '100vh',
  boxShadow: '6px 0 24px rgba(8, 131, 149, 0.25)',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
    pointerEvents: 'none'
  }
}));

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  margin: '6px 16px',
  borderRadius: '12px',
  padding: '12px 16px',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
  backdropFilter: active ? 'blur(10px)' : 'none',
  border: active ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: '#00d4ff',
    transform: active ? 'scaleY(1)' : 'scaleY(0)',
    transition: 'transform 0.3s ease',
    borderRadius: '0 4px 4px 0'
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    transform: 'translateX(4px)',
    '& .MuiListItemIcon-root': {
      color: '#00d4ff',
      transform: 'scale(1.1)'
    },
    '& .MuiListItemText-primary': {
      color: '#fff'
    }
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer'
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: '28px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
    opacity: 0.5
  }
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  marginTop: 'auto',
  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.3) 100%)',
  backdropFilter: 'blur(10px)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%)',
  }
}));

const CategoryLabel = styled(Typography)(({ theme }) => ({
  padding: '12px 24px 8px',
  display: 'block',
  color: '#00d4ff',
  fontSize: '0.75rem',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontWeight: '700',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '24px',
    bottom: '0',
    width: '30px',
    height: '2px',
    background: 'linear-gradient(90deg, #00d4ff, transparent)',
  }
}));

const LogoBox = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #00d4ff 0%, #088395 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 16px rgba(0, 212, 255, 0.3)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'rotate(-5deg) scale(1.05)'
  }
}));

const Sidebar = ({ onPageChange }) => {
  const [open, setOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const navigate = useNavigate();

  const [userName, setUserName] = useState('John Smith');
  const [userRole, setUserRole] = useState('Administrator');
  const [userInitials, setUserInitials] = useState('JS');

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');

    if (storedUserInfo) {
      try {
        const user = JSON.parse(storedUserInfo);
        setUserName(user.name || 'User');
        setUserRole(user.role || 'User');

        const nameParts = user.name ? user.name.split(' ') : ['U'];
        const initials = nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : nameParts[0].substring(0, 2).toUpperCase();

        setUserInitials(initials);
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  const handleClick = () => {
    setOpen(!open);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    navigate(`/${page}`);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard />, tooltip: 'Tổng quan hệ thống' },
    { id: 'customers', label: 'Customers', icon: <People />, tooltip: 'Quản lý khách hàng' },
    { id: 'products', label: 'Products', icon: <Inventory />, tooltip: 'Quản lý sản phẩm' },
    { id: 'contracts', label: 'Contracts', icon: <Assignment />, tooltip: 'Quản lý hợp đồng' },
    { id: 'transactions', label: 'Transactions', icon: <Description />, tooltip: 'Giao dịch' },
    { id: 'digital-twin', label: 'Digital Twin', icon: <Psychology />, tooltip: 'Mô phỏng số' }
  ];

  const analyticsItems = [
    { id: 'analytics', label: 'Analytics', icon: <Assessment />, tooltip: 'Phân tích dữ liệu' },
    { id: 'sales', label: 'Sales', icon: <AttachMoney />, tooltip: 'Báo cáo bán hàng' },
    { id: 'reports', label: 'Reports', icon: <Report />, tooltip: 'Báo cáo tổng hợp' },
    { id: 'copilotai', label: 'Copilot AI', icon: <SmartToy />, tooltip: 'Trợ lý AI thông minh' },
    { id: 'predictivechurn', label: 'Predictive Churn', icon: <TrendingDown />, tooltip: 'Dự đoán khách hàng rời bỏ' }
  ];

  return (
    <SidebarContainer>
      {/* Logo */}
      <SidebarHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <LogoBox>
            <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} />
          </LogoBox>
          <Typography 
            variant="h5" 
            fontWeight="800" 
            sx={{ 
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(0, 212, 255, 0.3)'
            }}
          >
            CRM System
          </Typography>
        </Box>
      </SidebarHeader>

      {/* Navigation Menu */}
      <Box sx={{ mt: 2, flex: 1, overflowY: 'auto', overflowX: 'hidden', pr: 1 }}>
        <List component="nav" sx={{ padding: '8px 0' }}>
          {menuItems.map((item) => (
            <Tooltip 
              key={item.id} 
              title={item.tooltip} 
              placement="right" 
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#088395',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    '& .MuiTooltip-arrow': {
                      color: '#088395',
                    }
                  }
                }
              }}
            >
              <StyledListItem
                button
                active={activePage === item.id ? 1 : 0}
                onClick={() => handlePageChange(item.id)}
              >
                <ListItemIcon sx={{
                  color: activePage === item.id ? '#00d4ff' : 'rgba(255, 255, 255, 0.75)',
                  minWidth: '44px',
                  transition: 'all 0.3s ease'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.95rem',
                      fontWeight: activePage === item.id ? '700' : '500',
                      color: activePage === item.id ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                      letterSpacing: '0.3px'
                    }
                  }}
                />
              </StyledListItem>
            </Tooltip>
          ))}

          <Box sx={{ my: 2, mx: 3 }}>
            <Divider sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              height: '1px'
            }} />
          </Box>

          <CategoryLabel variant="caption">
            Analytics
          </CategoryLabel>

          {analyticsItems.map((item) => (
            <Tooltip 
              key={item.id} 
              title={item.tooltip} 
              placement="right" 
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#088395',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    '& .MuiTooltip-arrow': {
                      color: '#088395',
                    }
                  }
                }
              }}
            >
              <StyledListItem
                button
                active={activePage === item.id ? 1 : 0}
                onClick={() => handlePageChange(item.id)}
              >
                <ListItemIcon sx={{
                  color: activePage === item.id ? '#00d4ff' : 'rgba(255, 255, 255, 0.75)',
                  minWidth: '44px',
                  transition: 'all 0.3s ease'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.95rem',
                      fontWeight: activePage === item.id ? '700' : '500',
                      color: activePage === item.id ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                      letterSpacing: '0.3px'
                    }
                  }}
                />
              </StyledListItem>
            </Tooltip>
          ))}
        </List>
      </Box>

      {/* User Profile Section */}
      <ProfileSection onClick={handleClick}>
        <Avatar
          src="/avatar.jpg"
          alt={userName}
          sx={{
            width: 44,
            height: 44,
            background: 'linear-gradient(135deg, #00d4ff 0%, #088395 100%)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 212, 255, 0.4)',
            fontSize: '1.1rem',
            fontWeight: '700'
          }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ ml: 2, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: '700', fontSize: '0.95rem' }}>
            {userName}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: '#00d4ff',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {userRole}
          </Typography>
        </Box>
        <Box sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </Box>
      </ProfileSection>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" sx={{ 
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.4) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <StyledListItem button>
            <ListItemIcon sx={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              minWidth: '44px',
              transition: 'all 0.3s ease'
            }}>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: '500'
                }
              }}
            />
          </StyledListItem>
          <StyledListItem
            button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            <ListItemIcon sx={{ 
              color: '#ff6b6b', 
              minWidth: '44px',
              transition: 'all 0.3s ease'
            }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Log Out"
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: '500'
                }
              }}
            />
          </StyledListItem>
        </List>
      </Collapse>
    </SidebarContainer>
  );
};

export default Sidebar;