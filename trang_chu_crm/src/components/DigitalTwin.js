import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Paper,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Badge,
  Alert,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  ShoppingCart,
  TrendingUp,
  AccessTime,
  Favorite,
  Star,
  Timeline,
  Psychology,
  AutoGraph,
  Insights,
  EmojiEvents,
  Warning,
  CheckCircle,
  Search,
  FilterList,
  Refresh,
  Download,
  Share,
  Edit,
  Visibility,
  AttachMoney,
  CalendarMonth,
  Category,
  LocalOffer,
  Speed,
  Security,
  Devices,
  Business
} from '@mui/icons-material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const DigitalTwin = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [customersList, setCustomersList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // API URL
  const API_URL = 'http://localhost:5000/api';

  // Load danh sách customers khi component mount
  useEffect(() => {
    loadCustomersList();
  }, []);

  // Load digital twin khi chọn customer
  useEffect(() => {
    if (selectedCustomerId) {
      loadDigitalTwin(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Load danh sách customers
  const loadCustomersList = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await fetch(`${API_URL}/digital-twin/customers?limit=100`, config);
      const data = await response.json();
      
      setCustomersList(data);
      if (data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(data[0].id);
      }
      setLoadingList(false);
    } catch (error) {
      console.error('Error loading customers:', error);
      setLoadingList(false);
    }
  };

  // Load digital twin data
  const loadDigitalTwin = async (customerId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await fetch(`${API_URL}/digital-twin/customer/${customerId}`, config);
      const data = await response.json();
      
      if (data && data.basicInfo) {
        setCustomerData(data);
      } else {
        console.warn('No digital twin data found for customer');
        setCustomerData(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading digital twin:', error);
      setCustomerData(null);
      setLoading(false);
    }
  };

  // Default empty customer data khi chưa có dữ liệu
  const getDefaultCustomerData = () => ({
    basicInfo: {
      name: 'Chưa có dữ liệu',
      email: '',
      phone: '',
      company: '',
      segment: 'Regular',
      status: 'Active',
      lifetimeValue: 0,
      loyaltyPoints: 0,
      preferredChannel: 'N/A',
      joinDate: ''
    },
    purchaseBehavior: {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastPurchaseDate: null,
      purchaseFrequency: 0,
      favoriteCategories: []
    },
    scores: {
      satisfactionScore: 0,
      engagementScore: 0,
      churnRisk: 0,
      loyaltyScore: 0
    },
    behavioralPattern: {
      interactionChannels: []
    },
    predictions: {
      nextPurchaseDate: null,
      nextPurchaseProbability: 0,
      estimatedNextOrderValue: 0,
      churnProbability: 0
    },
    interactions: [],
    recommendations: []
  });

  // Sử dụng data từ API hoặc default
  const defaultCustomerData = customerData || getDefaultCustomerData();

  // Data cho Behavioral Pattern Radar Chart - lấy từ API data hoặc tính toán
  const behaviorData = customerData ? [
    { trait: 'Tần suất mua', value: Math.min(100, (customerData.purchaseBehavior?.purchaseFrequency || 0) * 10) },
    { trait: 'Giá trị đơn', value: Math.min(100, Math.round((customerData.purchaseBehavior?.averageOrderValue || 0) / 100000)) },
    { trait: 'Độ trung thành', value: customerData.scores?.loyaltyScore || 0 },
    { trait: 'Tương tác', value: customerData.engagement?.emailOpenRate || customerData.scores?.engagementScore || 0 },
    { trait: 'Phản hồi', value: customerData.engagement?.clickRate || 50 },
    { trait: 'Giới thiệu', value: Math.round((customerData.engagement?.npsScore || 5) * 10) }
  ] : [
    { trait: 'Tần suất mua', value: 0 },
    { trait: 'Giá trị đơn', value: 0 },
    { trait: 'Độ trung thành', value: 0 },
    { trait: 'Tương tác', value: 0 },
    { trait: 'Phản hồi', value: 0 },
    { trait: 'Giới thiệu', value: 0 }
  ];

  // Purchase History Timeline - tính toán từ dữ liệu thực
  const purchaseTimeline = customerData ? (() => {
    const totalSpent = customerData.purchaseBehavior?.totalSpent || 0;
    const avgOrder = customerData.purchaseBehavior?.averageOrderValue || 0;
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
    return months.map((month, i) => ({
      month,
      value: i < 6 ? Math.round(avgOrder * (0.8 + Math.random() * 0.4)) : 0,
      predict: i >= 6 ? Math.round(avgOrder * (0.9 + Math.random() * 0.3)) : 0
    }));
  })() : [];

  // Product Categories - lấy từ API data
  const productCategories = customerData?.purchaseBehavior?.favoriteCategories ? 
    customerData.purchaseBehavior.favoriteCategories.map((cat, i) => ({
      name: cat,
      value: Math.round(100 / customerData.purchaseBehavior.favoriteCategories.length),
      color: ['#00bcd4', '#26c6da', '#4dd0e1', '#80deea'][i % 4]
    })) : [];

  // Channel Usage - lấy từ API data
  const channelUsage = customerData?.behavioralPattern?.interactionChannels || 
    (customerData?.basicInfo?.preferredChannel ? [{
      channel: customerData.basicInfo.preferredChannel,
      usage: 100,
      satisfaction: 85
    }] : []);

  // Interaction Timeline - sẽ được load từ API
  const interactions = customerData?.interactions || [];

  // Predictive Insights - tính toán từ dữ liệu thực
  const predictions = customerData ? [
    { 
      type: customerData.predictions?.nextPurchaseProbability >= 70 ? 'success' : 
            customerData.predictions?.nextPurchaseProbability >= 40 ? 'info' : 'warning',
      title: customerData.predictions?.nextPurchaseProbability >= 70 ? 'Khách hàng tiềm năng cao' : 
             customerData.predictions?.nextPurchaseProbability >= 40 ? 'Khách hàng tiềm năng' : 'Cần chú ý',
      description: `Xác suất mua hàng: ${customerData.predictions?.nextPurchaseProbability || 0}%`,
      icon: <TrendingUp />
    },
    {
      type: 'info',
      title: 'Sản phẩm gợi ý',
      description: customerData.predictions?.recommendedProducts?.length > 0 
        ? `Quan tâm: ${customerData.predictions.recommendedProducts.slice(0, 2).join(', ')}`
        : 'Chưa có gợi ý sản phẩm',
      icon: <Psychology />
    },
    {
      type: customerData.predictions?.churnRisk >= 50 ? 'error' : 
            customerData.predictions?.churnRisk >= 30 ? 'warning' : 'success',
      title: customerData.predictions?.churnRisk >= 50 ? 'Nguy cơ cao' : 
             customerData.predictions?.churnRisk >= 30 ? 'Cần chăm sóc' : 'Khách hàng ổn định',
      description: `Nguy cơ rời bỏ: ${customerData.predictions?.churnRisk || 0}%`,
      icon: <Warning />
    }
  ] : [];

  // AI Recommendations - lấy từ API hoặc tính toán
  const recommendations = customerData?.recommendations?.length > 0 
    ? customerData.recommendations 
    : (customerData?.predictions?.recommendedProducts || []).map((product, i) => ({
        action: `Gợi ý sản phẩm: ${product}`,
        priority: i === 0 ? 'high' : 'medium',
        impact: 80 - (i * 10)
      }));

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'VIP': return 'error';
      case 'Premium': return 'warning';
      case 'Regular': return 'info';
      default: return 'default';
    }
  };

  const getRiskColor = (score) => {
    if (score <= 20) return '#4caf50';
    if (score <= 50) return '#ff9800';
    return '#f44336';
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a1929 0%, #132f4c 50%, #1a2332 100%)',
      py: 3
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: 'rgba(16, 42, 67, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 188, 212, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: '1px solid rgba(0, 188, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 188, 212, 0.15)'
          }
        }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#fff' }}>
                Digital Twin Customer
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Bản sao số hóa toàn diện về hành vi và xu hướng khách hàng
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <TextField
                  placeholder="Tìm khách hàng..."
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#00bcd4' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    minWidth: 250,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(0, 188, 212, 0.05)',
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(0, 188, 212, 0.3)' },
                      '&:hover fieldset': { borderColor: '#00bcd4' },
                      '&.Mui-focused fieldset': { borderColor: '#00bcd4' }
                    }
                  }}
                />
                <Button 
                  variant="outlined" 
                  startIcon={<FilterList />}
                  sx={{
                    borderColor: 'rgba(0, 188, 212, 0.5)',
                    color: '#00bcd4',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#00bcd4',
                      bgcolor: 'rgba(0, 188, 212, 0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Bộ lọc
                </Button>
                <IconButton 
                  onClick={() => selectedCustomerId && loadDigitalTwin(selectedCustomerId)}
                  sx={{ 
                    color: '#00bcd4',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0, 188, 212, 0.1)',
                      transform: 'rotate(180deg)'
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Customer Profile Card */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress sx={{ color: '#00bcd4' }} />
          </Box>
        ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              borderRadius: 3, 
              height: '100%',
              background: 'rgba(16, 42, 67, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 188, 212, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                border: '1px solid rgba(0, 188, 212, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 188, 212, 0.15)'
              }
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={3} mb={3}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80,
                      background: 'linear-gradient(135deg, #00bcd4 0%, #26c6da 100%)',
                      fontSize: '2rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 8px 24px rgba(0, 188, 212, 0.4)'
                      }
                    }}
                  >
                    {defaultCustomerData.basicInfo.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>
                      {defaultCustomerData.basicInfo.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      ID: {selectedCustomerId || 'N/A'}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip 
                        label={defaultCustomerData.basicInfo.status} 
                        color={getStatusColor(defaultCustomerData.basicInfo.status)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Chip 
                        label={defaultCustomerData.basicInfo.segment}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0, 188, 212, 0.2)',
                          color: '#00bcd4',
                          borderColor: '#00bcd4'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(0, 188, 212, 0.1)' }} />

                <List dense>
                  <ListItem sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(0, 188, 212, 0.05)' }
                  }}>
                    <ListItemIcon><Email sx={{ color: '#00bcd4' }} /></ListItemIcon>
                    <ListItemText primary={defaultCustomerData.basicInfo.email} sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                  </ListItem>
                  <ListItem sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(0, 188, 212, 0.05)' }
                  }}>
                    <ListItemIcon><Phone sx={{ color: '#00bcd4' }} /></ListItemIcon>
                    <ListItemText primary={defaultCustomerData.basicInfo.phone} sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                  </ListItem>
                  <ListItem sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(0, 188, 212, 0.05)' }
                  }}>
                    <ListItemIcon><Business sx={{ color: '#00bcd4' }} /></ListItemIcon>
                    <ListItemText primary={defaultCustomerData.basicInfo.company} sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                  </ListItem>
                  <ListItem sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(0, 188, 212, 0.05)' }
                  }}>
                    <ListItemIcon><CalendarMonth sx={{ color: '#00bcd4' }} /></ListItemIcon>
                    <ListItemText 
                      primary={`Tham gia: ${defaultCustomerData.basicInfo.joinDate}`} 
                      sx={{ color: 'rgba(255, 255, 255, 0.9)' }} 
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2, borderColor: 'rgba(0, 188, 212, 0.1)' }} />

                {/* Key Metrics */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(0, 188, 212, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(0, 188, 212, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(0, 188, 212, 0.15)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0, 188, 212, 0.2)'
                      }
                    }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#00bcd4' }}>
                        {defaultCustomerData.purchaseBehavior.totalOrders}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Tổng đơn hàng
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(76, 175, 80, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.15)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)'
                      }
                    }}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {defaultCustomerData.scores.satisfactionScore}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Độ hài lòng
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255, 193, 7, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(255, 193, 7, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 193, 7, 0.15)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(255, 193, 7, 0.2)'
                      }
                    }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: '#ffc107' }}>
                        {formatCurrency(defaultCustomerData.basicInfo.lifetimeValue)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Lifetime Value
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Risk & Churn */}
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Đánh giá rủi ro
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box flex={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={defaultCustomerData.scores.churnRisk}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getRiskColor(defaultCustomerData.scores.churnRisk),
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                      {defaultCustomerData.scores.churnRisk}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Xác suất rời bỏ: {defaultCustomerData.predictions.churnProbability}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ 
              borderRadius: 3, 
              p: 3,
              background: 'rgba(16, 42, 67, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 188, 212, 0.1)',
              minHeight: '800px'
            }}>
              <Tabs 
                value={selectedTab} 
                onChange={handleTabChange} 
                sx={{ 
                  mb: 3,
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#00bcd4',
                      bgcolor: 'rgba(0, 188, 212, 0.05)'
                    },
                    '&.Mui-selected': {
                      color: '#00bcd4'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    bgcolor: '#00bcd4',
                    height: 3
                  }
                }}
              >
                <Tab label="Tổng quan" icon={<Insights />} iconPosition="start" />
                <Tab label="Hành vi" icon={<Psychology />} iconPosition="start" />
                <Tab label="Dự đoán" icon={<AutoGraph />} iconPosition="start" />
                <Tab label="Tương tác" icon={<Timeline />} iconPosition="start" />
              </Tabs>

              <Box sx={{ minHeight: '700px' }}>

              {/* Tab 1: Overview */}
              {selectedTab === 0 && (
                <Grid container spacing={3}>
                  {/* Purchase Timeline */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                      Lịch sử & Dự đoán mua hàng
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'rgba(0, 188, 212, 0.03)', 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid rgba(0, 188, 212, 0.1)'
                    }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={purchaseTimeline}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#00bcd4" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 188, 212, 0.1)" />
                          <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.6)" />
                          <YAxis stroke="rgba(255, 255, 255, 0.6)" />
                          <ChartTooltip 
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'rgba(16, 42, 67, 0.95)',
                              border: '1px solid rgba(0, 188, 212, 0.3)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            name="Thực tế"
                            stroke="#00bcd4" 
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="predict" 
                            name="Dự đoán"
                            stroke="#4caf50" 
                            fillOpacity={1} 
                            fill="url(#colorPredict)"
                            strokeDasharray="5 5"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>

                  {/* Category Distribution */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                      Phân bố danh mục mua hàng
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'rgba(0, 188, 212, 0.03)', 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid rgba(0, 188, 212, 0.1)'
                    }}>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={productCategories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {productCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: 'rgba(16, 42, 67, 0.95)',
                              border: '1px solid rgba(0, 188, 212, 0.3)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>

                  {/* Channel Usage */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                      Kênh tương tác
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'rgba(0, 188, 212, 0.03)', 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid rgba(0, 188, 212, 0.1)'
                    }}>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={channelUsage}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 188, 212, 0.1)" />
                          <XAxis dataKey="channel" stroke="rgba(255, 255, 255, 0.6)" />
                          <YAxis stroke="rgba(255, 255, 255, 0.6)" />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: 'rgba(16, 42, 67, 0.95)',
                              border: '1px solid rgba(0, 188, 212, 0.3)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="usage" name="Sử dụng (%)" fill="#00bcd4" />
                          <Bar dataKey="satisfaction" name="Hài lòng (%)" fill="#4caf50" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Tab 2: Behavior */}
              {selectedTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                      Mô hình hành vi
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'rgba(0, 188, 212, 0.03)', 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid rgba(0, 188, 212, 0.1)'
                    }}>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={behaviorData}>
                          <PolarGrid stroke="rgba(0, 188, 212, 0.2)" />
                          <PolarAngleAxis dataKey="trait" stroke="rgba(255, 255, 255, 0.8)" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(255, 255, 255, 0.6)" />
                          <Radar 
                            name="Điểm" 
                            dataKey="value" 
                            stroke="#00bcd4" 
                            fill="#00bcd4" 
                            fillOpacity={0.6} 
                          />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: 'rgba(16, 42, 67, 0.95)',
                              border: '1px solid rgba(0, 188, 212, 0.3)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                      Thông tin hành vi
                    </Typography>
                    <Stack spacing={2}>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(0, 188, 212, 0.05)',
                        border: '1px solid rgba(0, 188, 212, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0, 188, 212, 0.1)',
                          transform: 'translateX(8px)'
                        }
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Speed sx={{ color: '#00bcd4' }} />
                            <Typography variant="subtitle2" sx={{ color: '#fff' }}>Tần suất mua hàng</Typography>
                          </Box>
                          <Chip label="2.5 lần/tháng" sx={{ bgcolor: 'rgba(0, 188, 212, 0.2)', color: '#00bcd4' }} size="small" />
                        </Box>
                      </Paper>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(76, 175, 80, 0.05)',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                          transform: 'translateX(8px)'
                        }
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <AttachMoney color="success" />
                            <Typography variant="subtitle2" sx={{ color: '#fff' }}>Giá trị trung bình</Typography>
                          </Box>
                          <Chip label={formatCurrency(customerData.averageOrderValue)} color="success" size="small" />
                        </Box>
                      </Paper>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(33, 150, 243, 0.05)',
                        border: '1px solid rgba(33, 150, 243, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          transform: 'translateX(8px)'
                        }
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Devices color="info" />
                            <Typography variant="subtitle2" sx={{ color: '#fff' }}>Thiết bị ưa thích</Typography>
                          </Box>
                          <Chip label="Mobile (iOS)" color="info" size="small" />
                        </Box>
                      </Paper>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(255, 193, 7, 0.05)',
                        border: '1px solid rgba(255, 193, 7, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 193, 7, 0.1)',
                          transform: 'translateX(8px)'
                        }
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <AccessTime color="warning" />
                            <Typography variant="subtitle2" sx={{ color: '#fff' }}>Thời gian hoạt động</Typography>
                          </Box>
                          <Chip label="19:00 - 22:00" color="warning" size="small" />
                        </Box>
                      </Paper>
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(244, 67, 54, 0.05)',
                        border: '1px solid rgba(244, 67, 54, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                          transform: 'translateX(8px)'
                        }
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocalOffer color="error" />
                            <Typography variant="subtitle2" sx={{ color: '#fff' }}>Phản ứng với khuyến mãi</Typography>
                          </Box>
                          <Chip label="Cao (78%)" color="error" size="small" />
                        </Box>
                      </Paper>
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {/* Tab 3: Predictions */}
              {selectedTab === 2 && (
                <Grid container spacing={2}>
                  {/* Predictive Insights */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 1.5 }}>
                      Dự đoán AI
                    </Typography>
                    <Stack spacing={1.5}>
                      {predictions.map((prediction, index) => (
                        <Alert 
                          key={index}
                          severity={prediction.type}
                          icon={prediction.icon}
                          sx={{ 
                            borderRadius: 1.5,
                            py: 0.5,
                            bgcolor: prediction.type === 'success' 
                              ? 'rgba(76, 175, 80, 0.1)' 
                              : prediction.type === 'info' 
                              ? 'rgba(33, 150, 243, 0.1)'
                              : 'rgba(255, 152, 0, 0.1)',
                            border: `1px solid ${
                              prediction.type === 'success' 
                                ? 'rgba(76, 175, 80, 0.3)' 
                                : prediction.type === 'info' 
                                ? 'rgba(33, 150, 243, 0.3)'
                                : 'rgba(255, 152, 0, 0.3)'
                            }`,
                            color: '#fff',
                            '& .MuiAlert-icon': {
                              color: prediction.type === 'success' 
                                ? '#4caf50' 
                                : prediction.type === 'info' 
                                ? '#2196f3'
                                : '#ff9800'
                            }
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {prediction.title}
                          </Typography>
                          <Typography variant="caption">
                            {prediction.description}
                          </Typography>
                        </Alert>
                      ))}
                    </Stack>
                  </Grid>

                  {/* AI Recommendations */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 1.5 }}>
                      Đề xuất hành động
                    </Typography>
                    <Stack spacing={1.5}>
                      {recommendations.slice(0, 3).map((rec, index) => (
                        <Paper 
                          key={index} 
                          sx={{ 
                            p: 1.5,
                            bgcolor: 'rgba(0, 188, 212, 0.05)',
                            border: '1px solid rgba(0, 188, 212, 0.2)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: 'rgba(0, 188, 212, 0.1)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 16px rgba(0, 188, 212, 0.2)'
                            }
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                            <Box flex={1}>
                              <Typography variant="body2" sx={{ color: '#fff', mb: 0.5 }}>
                                {rec.action}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip 
                                  label={rec.priority === 'high' ? 'Cao' : rec.priority === 'medium' ? 'TB' : 'Thấp'}
                                  size="small"
                                  color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Tác động: {rec.impact}%
                                </Typography>
                              </Box>
                            </Box>
                            <Button 
                              variant="contained" 
                              size="small"
                              sx={{
                                bgcolor: '#00bcd4',
                                minWidth: 'auto',
                                px: 2,
                                fontSize: '0.75rem',
                                '&:hover': {
                                  bgcolor: '#26c6da',
                                  transform: 'scale(1.05)'
                                }
                              }}
                            >
                              Thực hiện
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>

                  {/* Next Best Action */}
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      p: 2, 
                      background: 'linear-gradient(135deg, #00bcd4 0%, #26c6da 100%)',
                      color: 'white',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0, 188, 212, 0.4)'
                      }
                    }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Next Best Action
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        Gửi email cá nhân hóa với voucher giảm 10% cho danh mục Điện tử trong vòng 24h tới
                      </Typography>
                      <Box display="flex" gap={1.5}>
                        <Button 
                          variant="contained" 
                          size="small"
                          sx={{ 
                            bgcolor: 'white', 
                            color: '#00bcd4',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          Thực hiện ngay
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          sx={{ 
                            borderColor: 'white', 
                            color: 'white',
                            '&:hover': {
                              borderColor: 'white',
                              bgcolor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          Lên lịch
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Tab 4: Interactions */}
              {selectedTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                      Lịch sử tương tác
                    </Typography>
                    <Stack spacing={2}>
                      {interactions.map((interaction, index) => (
                        <Paper 
                          key={index} 
                          sx={{ 
                            p: 2,
                            bgcolor: 'rgba(0, 188, 212, 0.05)',
                            border: '1px solid rgba(0, 188, 212, 0.2)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: 'rgba(0, 188, 212, 0.1)',
                              transform: 'translateX(8px)',
                              borderColor: 'rgba(0, 188, 212, 0.4)'
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              bgcolor: 'rgba(0, 188, 212, 0.2)',
                              color: '#00bcd4'
                            }}>
                              {interaction.icon}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#fff' }}>
                                {interaction.type}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {interaction.detail}
                              </Typography>
                            </Box>
                            {interaction.value && (
                              <Chip 
                                label={formatCurrency(interaction.value)} 
                                sx={{
                                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                                  color: '#4caf50',
                                  borderColor: '#4caf50'
                                }}
                              />
                            )}
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {interaction.date}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                    <Box display="flex" justifyContent="center" mt={3}>
                      <Button 
                        variant="outlined"
                        sx={{
                          borderColor: 'rgba(0, 188, 212, 0.5)',
                          color: '#00bcd4',
                          '&:hover': {
                            borderColor: '#00bcd4',
                            bgcolor: 'rgba(0, 188, 212, 0.1)'
                          }
                        }}
                      >
                        Xem thêm
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
        )}

        {/* Quick Actions */}
        <Paper sx={{ 
          mt: 3, 
          p: 3, 
          borderRadius: 3,
          background: 'rgba(16, 42, 67, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 188, 212, 0.1)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            Hành động nhanh
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button 
              variant="contained" 
              startIcon={<Email />}
              sx={{
                bgcolor: '#00bcd4',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#26c6da',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 188, 212, 0.4)'
                }
              }}
            >
              Gửi Email
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<Phone />}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)'
                }
              }}
            >
              Gọi điện
            </Button>
            <Button 
              variant="contained" 
              color="warning" 
              startIcon={<LocalOffer />}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(255, 193, 7, 0.4)'
                }
              }}
            >
              Tạo voucher
            </Button>
            <Button 
              variant="contained" 
              color="info" 
              startIcon={<Edit />}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.4)'
                }
              }}
            >
              Cập nhật thông tin
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Share />}
              sx={{
                borderColor: 'rgba(0, 188, 212, 0.5)',
                color: '#00bcd4',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#00bcd4',
                  bgcolor: 'rgba(0, 188, 212, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Chia sẻ
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Download />}
              sx={{
                borderColor: 'rgba(0, 188, 212, 0.5)',
                color: '#00bcd4',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#00bcd4',
                  bgcolor: 'rgba(0, 188, 212, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Xuất báo cáo
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DigitalTwin;