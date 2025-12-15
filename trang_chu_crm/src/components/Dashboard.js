import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, IconButton, Avatar, Divider, Paper, Button, Menu, MenuItem } from '@mui/material';
import axios from 'axios';
import {
  Search, Notifications, ArrowUpward, ArrowDownward, People,
  MonetizationOn, TrendingUp, Assessment, MoreVert,
  CalendarToday, FilterList, Download, Refresh
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart, Bar } from 'recharts';

const Dashboard = () => {
  // State để điều khiển các menu và bộ lọc
  const [anchorEl, setAnchorEl] = useState(null);
  const [timeFilter, setTimeFilter] = useState('Tháng này');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    potentialCustomers: 0,
    conversionRate: 0
  });

  const [revenueData, setRevenueData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [customerGrowthData, setCustomerGrowthData] = useState([]);
  const [growthData, setGrowthData] = useState({
    customerGrowth: 0,
    revenueGrowth: 0,
    potentialGrowth: 0,
    conversionGrowth: 0
  });

  // Hàm xử lý menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    handleMenuClose();
  };

  // Tooltip tùy chỉnh cho biểu đồ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ 
          p: 2, 
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#0ea5e9' }}>{label}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {payload.map((entry, index) => (
              <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: entry.color, borderRadius: '50%' }} />
                <Typography variant="body2" sx={{ color: '#e2e8f0' }}>{`${entry.name}: ${entry.value ? entry.value.toLocaleString('vi-VN') : 0} ₫`}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      );
    }
    return null;
  };

  // Thêm hàm fetchDashboardData 
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No authentication token found');
        setError('Chưa đăng nhập. Vui lòng đăng nhập để xem dữ liệu.');
        setIsLoading(false);
        // Không redirect ngay, để user có thể xem UI
        return;
      }

      const overviewResponse = await axios.get('/api/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDashboardData(overviewResponse.data);

      const mappedTimeFilter = timeFilter === 'Tháng này'
        ? 'month'
        : timeFilter === 'Tuần này'
          ? 'week'
          : timeFilter === 'Quý này'
            ? 'quarter'
            : timeFilter === 'Năm nay'
              ? 'year'
              : timeFilter === 'Hôm nay'
                ? 'today'
                : 'week';

      console.log('Đang gọi API revenue-chart với period:', mappedTimeFilter);

      const revenueResponse = await axios.get(`/api/dashboard/revenue-chart?period=${mappedTimeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Dữ liệu revenue-chart nhận được:', revenueResponse.data);

      const transformedRevenueData = transformRevenueData(revenueResponse.data);
      console.log('Dữ liệu sau khi xử lý:', transformedRevenueData);
      setRevenueData(transformedRevenueData);

      const customersResponse = await axios.get('/api/dashboard/top-customers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Dữ liệu top-customers nhận được:', customersResponse.data);

      if (customersResponse.data && Array.isArray(customersResponse.data)) {
        setTopCustomers(customersResponse.data);
      } else {
        console.warn('Dữ liệu khách hàng hàng đầu không đúng định dạng mảng.');
        setTopCustomers([]);
      }

      const growthResponse = await axios.get('/api/dashboard/customer-growth', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Dữ liệu growth nhận được:', growthResponse.data);

      const transformedGrowthData = transformGrowthData(growthResponse.data);
      setCustomerGrowthData(transformedGrowthData);

      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);

      if (error.response) {
        if (error.response.status === 401) {
          setError('Phiên đăng nhập hết hạn. Nhấn refresh để đăng nhập lại.');
        } else if (error.response.status === 404) {
          setError('API chưa sẵn sàng. Vui lòng kiểm tra kết nối server.');
        } else {
          setError(`Lỗi kết nối API (${error.response.status}). Vui lòng thử lại.`);
        }
      } else if (error.request) {
        setError('Không thể kết nối server. Vui lòng kiểm tra kết nối.');
      } else {
        setError(`Lỗi: ${error.message}`);
      }

      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleAddNewData = () => {
    window.location.href = '/transactions';
  };

  const handleAddNewCustomer = () => {
    window.location.href = '/customers';
  };

  const handleCreateNewReport = () => {
    window.location.href = '/reports';
  };

  const handleAddNewTransaction = () => {
    window.location.href = '/transactions';
  };

  const fetchGrowthData = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await axios.get('/api/dashboard/growth-metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Growth metrics data received:', response.data);

      setGrowthData(response.data);
    } catch (error) {
      console.error('Error fetching growth metrics:', error);
    }
  };

  const transformRevenueData = (data) => {
    if (!data || !Array.isArray(data)) {
      console.warn('Dữ liệu không hợp lệ hoặc không phải mảng.');
      return [];
    }

    return data.map(item => ({
      date: item.date || item.label || '',
      revenue: parseFloat(item.revenue) || 0,
      expense: parseFloat(item.expense) || 0
    }));
  };

  const transformGrowthData = (data) => {
    if (!data || !Array.isArray(data)) {
      console.warn('Dữ liệu không hợp lệ hoặc không phải mảng.');
      return [];
    }

    if (data.length === 0) {
      console.warn('Dữ liệu growth rỗng từ API.');
      return [];
    }

    return data.map(item => ({
      month: item.month || '',
      newCustomers: parseInt(item.newCustomers) || 0,
      totalCustomers: parseInt(item.totalCustomers) || 0
    }));
  };

  useEffect(() => {
    fetchDashboardData();
    fetchGrowthData();
  }, [timeFilter]);

  // Không block UI khi loading hoặc có lỗi, chỉ hiển thị thông báo nhỏ

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c4a6e 100%)',
      p: 3
    }}>
      {/* Notification bar cho loading và error - không block UI */}
      {(isLoading || error) && (
        <Box sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          minWidth: '300px',
          maxWidth: '400px'
        }}>
          <Card sx={{
            background: error 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(14, 165, 233, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isLoading ? (
                  <>
                    <Box sx={{
                      width: 24,
                      height: 24,
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '3px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} />
                    <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                      Đang tải dữ liệu...
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ color: '#fff', flex: 1, fontSize: '14px' }}>
                      {error}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={handleRefresh}
                      sx={{ 
                        color: '#fff',
                        '&:hover': { background: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Header Section with Ocean Theme */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        p: 3,
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(14, 165, 233, 0.2)',
        boxShadow: '0 8px 32px rgba(14, 165, 233, 0.15)'
      }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            Dashboard Quản Lý
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '14px' }}>
            Theo dõi hiệu suất kinh doanh của bạn
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            startIcon={<CalendarToday />}
            endIcon={<FilterList />}
            onClick={handleMenuOpen}
            sx={{
              color: '#0ea5e9',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '12px',
              px: 3,
              py: 1,
              background: 'rgba(14, 165, 233, 0.05)',
              '&:hover': {
                background: 'rgba(14, 165, 233, 0.15)',
                borderColor: 'rgba(14, 165, 233, 0.5)',
              }
            }}
          >
            {timeFilter}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: '#1e293b',
                border: '1px solid rgba(14, 165, 233, 0.2)',
                borderRadius: '12px',
                mt: 1
              }
            }}
          >
            {['Hôm nay', 'Tuần này', 'Tháng này', 'Quý này', 'Năm nay'].map((filter) => (
              <MenuItem
                key={filter}
                onClick={() => handleTimeFilterChange(filter)}
                sx={{
                  color: timeFilter === filter ? '#0ea5e9' : '#94a3b8',
                  '&:hover': { bgcolor: 'rgba(14, 165, 233, 0.1)' }
                }}
              >
                {filter}
              </MenuItem>
            ))}
          </Menu>
          <IconButton
            onClick={handleRefresh}
            sx={{
              color: '#0ea5e9',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '12px',
              background: 'rgba(14, 165, 233, 0.05)',
              '&:hover': {
                background: 'rgba(14, 165, 233, 0.15)',
                borderColor: 'rgba(14, 165, 233, 0.5)',
              }
            }}
          >
            <Refresh />
          </IconButton>
          <IconButton
            sx={{
              color: '#0ea5e9',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '12px',
              background: 'rgba(14, 165, 233, 0.05)',
              '&:hover': {
                background: 'rgba(14, 165, 233, 0.15)',
                borderColor: 'rgba(14, 165, 233, 0.5)',
              }
            }}
          >
            <Notifications />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Grid with Ocean Theme */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr 300px' },
        gap: 3,
        mb: 3
      }}>
        {/* Stat Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(14, 165, 233, 0.25)',
              borderColor: 'rgba(14, 165, 233, 0.4)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)'
                }}>
                  <People sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Box sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '20px',
                  background: growthData.customerGrowth >= 0 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: `1px solid ${growthData.customerGrowth >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {growthData.customerGrowth >= 0 ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
                  <Typography sx={{
                    color: growthData.customerGrowth >= 0 ? '#10b981' : '#ef4444',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {growthData.customerGrowth >= 0 ? '+' : ''}{growthData.customerGrowth.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ 
                color: '#fff', 
                fontWeight: 'bold',
                mb: 0.5,
                textShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
              }}>
                {dashboardData.totalCustomers}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 500
              }}>
                Tổng khách hàng
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(6, 182, 212, 0.25)',
              borderColor: 'rgba(6, 182, 212, 0.4)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(6, 182, 212, 0.4)'
                }}>
                  <MonetizationOn sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Box sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '20px',
                  background: growthData.revenueGrowth >= 0 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: `1px solid ${growthData.revenueGrowth >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {growthData.revenueGrowth >= 0 ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
                  <Typography sx={{
                    color: growthData.revenueGrowth >= 0 ? '#10b981' : '#ef4444',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {growthData.revenueGrowth >= 0 ? '+' : ''}{growthData.revenueGrowth.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ 
                color: '#fff', 
                fontWeight: 'bold',
                mb: 0.5,
                textShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
              }}>
                {new Intl.NumberFormat('vi-VN', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1
                }).format(dashboardData.totalRevenue)}₫
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 500
              }}>
                Tổng doanh thu
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(7, 89, 133, 0.05) 100%)',
            border: '1px solid rgba(8, 145, 178, 0.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(8, 145, 178, 0.25)',
              borderColor: 'rgba(8, 145, 178, 0.4)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0891b2 0%, #075985 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(8, 145, 178, 0.4)'
                }}>
                  <TrendingUp sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Box sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '20px',
                  background: growthData.potentialGrowth >= 0 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: `1px solid ${growthData.potentialGrowth >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {growthData.potentialGrowth >= 0 ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
                  <Typography sx={{
                    color: growthData.potentialGrowth >= 0 ? '#10b981' : '#ef4444',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {growthData.potentialGrowth >= 0 ? '+' : ''}{growthData.potentialGrowth.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ 
                color: '#fff', 
                fontWeight: 'bold',
                mb: 0.5,
                textShadow: '0 2px 8px rgba(8, 145, 178, 0.3)'
              }}>
                {dashboardData.potentialCustomers}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 500
              }}>
                KH tiềm năng
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(7, 89, 133, 0.1) 0%, rgba(3, 105, 161, 0.05) 100%)',
            border: '1px solid rgba(7, 89, 133, 0.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(7, 89, 133, 0.25)',
              borderColor: 'rgba(7, 89, 133, 0.4)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #075985 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(7, 89, 133, 0.4)'
                }}>
                  <Assessment sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Box sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '20px',
                  background: growthData.conversionGrowth >= 0 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: `1px solid ${growthData.conversionGrowth >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {growthData.conversionGrowth >= 0 ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
                  <Typography sx={{
                    color: growthData.conversionGrowth >= 0 ? '#10b981' : '#ef4444',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {growthData.conversionGrowth >= 0 ? '+' : ''}{growthData.conversionGrowth.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ 
                color: '#fff', 
                fontWeight: 'bold',
                mb: 0.5,
                textShadow: '0 2px 8px rgba(7, 89, 133, 0.3)'
              }}>
                {dashboardData.conversionRate}%
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 500
              }}>
                Tỉ lệ chuyển đổi
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Top Customers - Right Side with Ocean Theme */}
        <Card sx={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.2)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          gridRow: 'span 1'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ 
                color: '#fff',
                fontWeight: 600
              }}>
                Khách hàng VIP
              </Typography>
              <Button size="small" sx={{ 
                color: '#0ea5e9',
                '&:hover': {
                  background: 'rgba(14, 165, 233, 0.1)'
                }
              }}>
                Xem tất cả
              </Button>
            </Box>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {topCustomers && topCustomers.length > 0 ? (
                topCustomers.slice(0, 3).map((customer, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: index < 2 ? '1px solid rgba(14, 165, 233, 0.1)' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(14, 165, 233, 0.05)',
                        borderRadius: '8px',
                        px: 1
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: index === 0 
                          ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                          : index === 1 
                          ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                          : 'linear-gradient(135deg, #0891b2 0%, #075985 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                      }}>
                        {index + 1}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {customer.transactions} giao dịch
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: '#0ea5e9', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
                    }}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0
                      }).format(customer.totalSpent)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ color: '#64748b', mb: 2 }}>
                    Chưa có dữ liệu
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddNewTransaction}
                    sx={{
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)',
                      }
                    }}
                  >
                    Thêm giao dịch
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Charts Section with Ocean Theme */}
      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={7}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            height: '400px'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                  Biểu đồ doanh thu
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: '8px',
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid rgba(14, 165, 233, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0ea5e9' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Doanh thu</Typography>
                  </Box>
                  <Box sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Chi phí</Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ height: 300 }}>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(14, 165, 233, 0.1)" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Doanh thu" 
                        stroke="#0ea5e9" 
                        strokeWidth={3}
                        dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expense" 
                        name="Chi phí" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography sx={{ color: '#64748b' }}>Chưa có dữ liệu</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Growth Chart */}
        <Grid item xs={12} lg={5}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            height: '400px'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                  Tăng trưởng khách hàng
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#06b6d4' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>KH mới</Typography>
                  </Box>
                  <Box sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Tổng KH</Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ height: 300 }}>
                {customerGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerGrowthData}>
                      <defs>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#0891b2" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.1)" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Bar 
                        dataKey="newCustomers" 
                        name="KH mới" 
                        fill="url(#colorNew)" 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="totalCustomers" 
                        name="Tổng KH" 
                        fill="url(#colorTotal)" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography sx={{ color: '#64748b' }}>Chưa có dữ liệu</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;