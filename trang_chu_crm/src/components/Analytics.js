import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Skeleton,
  Alert,
  Snackbar,
  IconButton,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// COLORS for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  // State management
  const [timeRange, setTimeRange] = useState('year');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Data states
  const [salesData, setSalesData] = useState([]);
  const [customerSegmentData, setCustomerSegmentData] = useState([]);
  const [customerGrowthData, setCustomerGrowthData] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCustomers: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    growthRate: 0
  });

  const [insightsData, setInsightsData] = useState({
    monthlyRevenueGrowth: {
      value: 0,
      percentage: 0,
      description: ''
    },
    customerRetentionRate: {
      value: 0,
      description: ''
    },
    avgTransactionValue: {
      value: 0,
      growth: 0,
      description: ''
    },
    recommendations: []
  });

  // Theme styles - DARK THEME
  const themeStyles = {
    backgroundColor: '#0a1929',
    color: '#fff',
    transition: 'all 0.3s ease',
  };

  const paperStyles = {
    backgroundColor: '#132f4c',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    overflow: 'hidden'
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
    fetchData(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Show notification
  const showNotification = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  // Fetch data from API
  // Cập nhật phương thức fetchData trong Analytics.js
  const fetchData = async (period = timeRange) => {
    setLoading(true);
    setError(null);

    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      // 1. Lấy dữ liệu tổng quan
      const summaryResponse = await fetch(`/api/analytics/summary?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!summaryResponse.ok) {
        throw new Error('Lỗi khi lấy dữ liệu tổng quan');
      }

      const summaryData = await summaryResponse.json();

      // 2. Lấy dữ liệu biểu đồ doanh thu
      const revenueResponse = await fetch(`/api/analytics/revenue-chart?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!revenueResponse.ok) {
        throw new Error('Lỗi khi lấy dữ liệu doanh thu');
      }

      const revenueData = await revenueResponse.json();

      // 3. Lấy dữ liệu phân khúc khách hàng
      const segmentsResponse = await fetch(`/api/analytics/customer-segments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!segmentsResponse.ok) {
        throw new Error('Lỗi khi lấy dữ liệu phân khúc khách hàng');
      }

      const segmentsData = await segmentsResponse.json();

      // 4. Lấy dữ liệu customer growth
      const customerGrowthResponse = await fetch(`/api/analytics/customer-growth?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!customerGrowthResponse.ok) {
        throw new Error('Lỗi khi lấy dữ liệu customer growth');
      }

      const customerGrowthData = await customerGrowthResponse.json();

      // 5. Lấy dữ liệu insights
      const insightsResponse = await fetch(`/api/analytics/insights?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!insightsResponse.ok) {
        throw new Error('Lỗi khi lấy dữ liệu insights');
      }

      const insightsData = await insightsResponse.json();

      // Cập nhật state với dữ liệu từ API
      setSalesData(revenueData);
      setCustomerSegmentData(segmentsData);
      setCustomerGrowthData(customerGrowthData);

      // Cập nhật state với dữ liệu tổng quan
      setStats({
        totalSales: summaryData.totalSales,
        totalCustomers: summaryData.totalCustomers,
        totalTransactions: summaryData.totalTransactions,
        averageOrderValue: summaryData.averageOrderValue,
        growthRate: summaryData.salesGrowth
      });

      // Tạo mô tả tiếng Việt cho insights
      const revenueGrowth = insightsData.revenue.growth;
      const customerRetention = insightsData.customers.retention;
      const avgTransactionGrowth = insightsData.transactions.growth;

      // Tạo văn bản mô tả dựa vào dữ liệu
      let revenueDescription = '';
      if (revenueGrowth > 15) {
        revenueDescription = "Doanh nghiệp của bạn đã cho thấy sự tăng trưởng đáng kể so với kỳ trước, với hiệu suất mạnh mẽ trong những tháng gần đây.";
      } else if (revenueGrowth > 0) {
        revenueDescription = "Doanh nghiệp của bạn đã cho thấy sự tăng trưởng vừa phải so với kỳ trước.";
      } else {
        revenueDescription = "Doanh nghiệp của bạn đã gặp phải sự sụt giảm so với kỳ trước. Hãy xem xét lại chiến lược bán hàng của bạn.";
      }

      let retentionDescription = '';
      if (customerRetention > 70) {
        retentionDescription = "Chiến lược giữ chân khách hàng của bạn đang hoạt động đặc biệt tốt. Hãy tiếp tục phát triển dựa trên nền tảng vững chắc này.";
      } else if (customerRetention > 50) {
        retentionDescription = "Chiến lược giữ chân khách hàng của bạn đang hoạt động tốt. Hãy cân nhắc các ưu đãi cá nhân hóa để tăng tỷ lệ này hơn nữa.";
      } else {
        retentionDescription = "Chiến lược giữ chân khách hàng của bạn cần được cải thiện. Hãy tập trung vào việc nâng cao trải nghiệm khách hàng và triển khai các chương trình khách hàng thân thiết.";
      }

      let transactionDescription = '';
      if (avgTransactionGrowth > 0) {
        transactionDescription = "Chiến lược bán hàng gia tăng của bạn dường như đang hiệu quả, dẫn đến các giao dịch có giá trị cao hơn.";
      } else {
        transactionDescription = "Giá trị giao dịch trung bình của bạn đã giảm. Hãy cân nhắc áp dụng các kỹ thuật bán hàng gia tăng và bán chéo.";
      }

      // Tạo khuyến nghị dựa trên dữ liệu
      let recommendations = [
        "Tập trung mở rộng các kênh thu hút khách hàng mới; tỷ lệ chuyển đổi của bạn cần được cải thiện để thu hút nhiều khách hàng mới hơn.",
        "Cân nhắc triển khai chương trình khách hàng thân thiết, đặc biệt là nhắm đến khách hàng trong ba tháng đầu tiên."
      ];

      // Cập nhật state với dữ liệu insights được xử lý
      setInsightsData({
        monthlyRevenueGrowth: {
          value: insightsData.revenue.current - insightsData.revenue.previous,
          percentage: revenueGrowth,
          description: revenueDescription
        },
        customerRetentionRate: {
          value: customerRetention,
          description: retentionDescription
        },
        avgTransactionValue: {
          value: insightsData.transactions.avgValue,
          growth: avgTransactionGrowth,
          description: transactionDescription
        },
        recommendations: recommendations
      });

      showNotification(`Dữ liệu đã được cập nhật cho ${period === 'year' ? 'năm vừa qua' : `${period} vừa qua`}`);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu:', err);
      setError('Không thể lấy dữ liệu analytics. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Tải xuống báo cáo
  const downloadReport = () => {
    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      // Hiện tại chỉ hiển thị thông báo
      showNotification('Báo cáo analytics đã được tải xuống thành công');
    } catch (error) {
      console.error('Lỗi khi tải báo cáo:', error);
      showNotification('Không thể tải báo cáo. Vui lòng thử lại sau.');
    }
  };

  // Xử lý làm mới dữ liệu
  const refreshData = () => {
    fetchData(timeRange);  // Sử dụng timeRange hiện tại
    showNotification('Đang làm mới dữ liệu...');
  };

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]); // Thêm timeRange vào dependencies

  return (
    <Container maxWidth={false} sx={{ mt: 0, ...themeStyles, p: 3, borderRadius: 2, minHeight: '100vh' }}>
      {/* Header with title and controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          color="#fff"
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Analytics Dashboard
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={downloadReport}
            sx={{
              color: '#00bcd4',
              borderColor: '#00bcd4',
              '&:hover': {
                borderColor: '#00acc1',
                backgroundColor: 'rgba(0, 188, 212, 0.08)'
              }
            }}
          >
            Export Report
          </Button>

          <IconButton
            size="small"
            onClick={refreshData}
            disabled={loading}
            sx={{
              color: '#00bcd4',
              border: '1px solid #00bcd4',
              p: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 188, 212, 0.08)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#00bcd4' }} /> : <RefreshIcon />}
          </IconButton>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label" sx={{ color: '#b0bec5' }}>Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
              size="small"
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00bcd4',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00bcd4',
                },
                '.MuiSvgIcon-root': {
                  color: '#fff',
                }
              }}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, backgroundColor: '#d32f2f', color: '#fff' }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 4, ...paperStyles, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)' } }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#b0bec5' }}>
                    Total Sales
                  </Typography>
                  {loading ? (
                    <Skeleton variant="text" width={100} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold', color: '#fff' }}>
                      ${stats.totalSales.toLocaleString()}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: stats.growthRate > 0 ? '#4caf50' : '#f44336',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    {stats.growthRate > 0 ? '↑' : '↓'} {Math.abs(stats.growthRate)}% from previous period
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 188, 212, 0.2)',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AttachMoneyIcon sx={{ color: '#00bcd4', fontSize: 30 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 4, ...paperStyles, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)' } }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#b0bec5' }}>
                    Total Customers
                  </Typography>
                  {loading ? (
                    <Skeleton variant="text" width={100} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold', color: '#fff' }}>
                      {stats.totalCustomers}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    ↑ 12% from previous period
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 188, 212, 0.2)',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PeopleIcon sx={{ color: '#00bcd4', fontSize: 30 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 4, ...paperStyles, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)' } }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#b0bec5' }}>
                    Total Transactions
                  </Typography>
                  {loading ? (
                    <Skeleton variant="text" width={100} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold', color: '#fff' }}>
                      {stats.totalTransactions}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    ↑ 8% from previous period
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 188, 212, 0.2)',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShoppingCartIcon sx={{ color: '#00bcd4', fontSize: 30 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 4, ...paperStyles, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)' } }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#b0bec5' }}>
                    Avg. Order Value
                  </Typography>
                  {loading ? (
                    <Skeleton variant="text" width={100} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold', color: '#fff' }}>
                      ${stats.averageOrderValue}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    ↑ 5% from previous period
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 188, 212, 0.2)',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#00bcd4', fontSize: 30 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs section */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Box sx={{
          borderBottom: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="analytics tabs"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                color: '#b0bec5',
                '&.Mui-selected': {
                  color: '#00bcd4',
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00bcd4',
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Revenue" />
            <Tab label="Customers" />
            <Tab label="Performance" />
            <Tab label="Conversion" />
          </Tabs>
        </Box>
      </Box>

      {/* TAB 1: REVENUE */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles, minHeight: '500px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="#fff">
                  Sales Trends
                </Typography>
                <MuiTooltip title="Shows sales data over time">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#b0bec5' }} />
                </MuiTooltip>
              </Box>

              {/* Line chart for Sales Trends */}
              <Box width="100%" height="450px" display="flex" justifyContent="center">
                {loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <CircularProgress sx={{ color: '#00bcd4' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#00bcd4" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e3a5f',
                          borderColor: '#00bcd4',
                          borderRadius: 8,
                          fontSize: 14,
                          color: '#fff'
                        }}
                        formatter={(value) => [`${value}`, 'Sales']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={16}
                        wrapperStyle={{ fontSize: 14, paddingTop: '20px', color: '#fff' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#00bcd4"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        name="Sales ($)"
                        activeDot={{ r: 8 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles, minHeight: '500px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="#fff">
                  Monthly Transactions
                </Typography>
                <MuiTooltip title="Shows number of transactions per month">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#b0bec5' }} />
                </MuiTooltip>
              </Box>

              {/* Bar chart for Transactions */}
              <Box width="100%" height="450px" display="flex" justifyContent="center">
                {loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <CircularProgress sx={{ color: '#00bcd4' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e3a5f',
                          borderColor: '#00bcd4',
                          borderRadius: 8,
                          fontSize: 14,
                          color: '#fff'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={16}
                        wrapperStyle={{ fontSize: 14, paddingTop: '20px', color: '#fff' }}
                      />
                      <Bar
                        dataKey="transactions"
                        fill="#00bcd4"
                        name="Transactions"
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: CUSTOMERS */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles, minHeight: '500px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="#fff">
                  Customer Acquisition
                </Typography>
                <MuiTooltip title="Shows new customers per month">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#b0bec5' }} />
                </MuiTooltip>
              </Box>

              {/* Line chart for Customer Acquisition */}
              <Box width="100%" height="450px" display="flex" justifyContent="center">
                {loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <CircularProgress sx={{ color: '#00bcd4' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={customerGrowthData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e3a5f',
                          borderColor: '#00bcd4',
                          borderRadius: 8,
                          fontSize: 14,
                          color: '#fff'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={16}
                        wrapperStyle={{ fontSize: 14, paddingTop: '20px', color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="#00bcd4"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                        name="New Customers"
                        dot={{ stroke: '#00bcd4', strokeWidth: 2, r: 4, fill: '#132f4c' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles, minHeight: '500px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="#fff">
                  Customer Segments
                </Typography>
                <MuiTooltip title="Distribution of customer types">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#b0bec5' }} />
                </MuiTooltip>
              </Box>

              {/* Pie chart for Customer Segments */}
              <Box width="100%" height="450px" display="flex" justifyContent="center">
                {loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <CircularProgress sx={{ color: '#00bcd4' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerSegmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={160}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {customerSegmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e3a5f',
                          borderColor: '#00bcd4',
                          borderRadius: 8,
                          fontSize: 14,
                          color: '#fff'
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconSize={16}
                        wrapperStyle={{ fontSize: 14, paddingTop: '30px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: PERFORMANCE */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles, minHeight: '600px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="#fff">
                  Sales Performance
                </Typography>
                <MuiTooltip title="Combined view of sales and customer acquisition">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#b0bec5' }} />
                </MuiTooltip>
              </Box>

              {/* Bar chart for Performance */}
              <Box width="100%" height="550px" display="flex" justifyContent="center">
                {loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <CircularProgress sx={{ color: '#00bcd4' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#00bcd4"
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickFormatter={(value) => `${value}`}
                        label={{
                          value: 'Sales ($)',
                          angle: -90,
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: '#00bcd4', fontSize: 14 },
                          offset: -5
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#4caf50"
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        label={{
                          value: 'Customers',
                          angle: 90,
                          position: 'insideRight',
                          style: { textAnchor: 'middle', fill: '#4caf50', fontSize: 14 },
                          offset: 0
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e3a5f',
                          borderColor: '#00bcd4',
                          borderRadius: 8,
                          fontSize: 14,
                          color: '#fff'
                        }}
                        formatter={(value, name) => [name === 'Sales ($)' ? `${value}` : value, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={16}
                        wrapperStyle={{ fontSize: 14, paddingTop: '20px', color: '#fff' }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="sales"
                        fill="#00bcd4"
                        name="Sales ($)"
                        barSize={35}
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="customers"
                        fill="#4caf50"
                        name="Customers"
                        barSize={35}
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 4: CONVERSION */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles, minHeight: '500px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="#fff">
                  Conversion Rate
                </Typography>
                <MuiTooltip title="Percentage of visitors who completed a transaction">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#b0bec5' }} />
                </MuiTooltip>
              </Box>

              {/* Line chart for Conversion Rate */}
              <Box width="100%" height="450px" display="flex" justifyContent="center">
                {loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <CircularProgress sx={{ color: '#00bcd4' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesData.map(item => {
                        const totalCustomersInPeriod = stats.totalCustomers || 5;
                        const customersWithTransactions = Math.min(item.transactions, totalCustomersInPeriod);
                        const conversionRate = totalCustomersInPeriod > 0 ?
                          Math.round((customersWithTransactions / totalCustomersInPeriod) * 100) : 0;

                        const result = {
                          ...item,
                          conversion: Math.max(conversionRate, 10) // Minimum 10%
                        };

                        console.log('Conversion Data:', JSON.stringify(result, null, 2)); // ← Chi tiết hơn               
                        return result;
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#00bcd4" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        tick={{ fill: '#b0bec5', fontSize: 14 }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e3a5f',
                          borderColor: '#00bcd4',
                          borderRadius: 8,
                          fontSize: 14,
                          color: '#fff'
                        }}
                        formatter={(value) => [`${value}%`, 'Conversion Rate']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={16}
                        wrapperStyle={{ fontSize: 14, paddingTop: '20px', color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="conversion"
                        stroke="#00bcd4"
                        fillOpacity={1}
                        fill="url(#colorConversion)"
                        strokeWidth={3}
                        name="Conversion Rate (%)"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles, minHeight: '500px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="#fff">
                  Conversion Metrics
                </Typography>
                <MuiTooltip title="Key conversion metrics">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#b0bec5' }} />
                </MuiTooltip>
              </Box>

              {loading ? (
                <Box display="flex" flexDirection="column" gap={2} mt={4}>
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                </Box>
              ) : (
                <Stack spacing={3} mt={3}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(0, 188, 212, 0.15)', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#b0bec5' }}>
                      Average Conversion Rate
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5, color: '#00bcd4', fontWeight: 'bold' }}>
                      67.8%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4caf50', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      ↑ 5.2% from previous period
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: 'rgba(0, 188, 212, 0.15)', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#b0bec5' }}>
                      Cart Abandonment Rate
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5, color: '#00bcd4', fontWeight: 'bold' }}>
                      23.4%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4caf50', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      ↓ 3.1% from previous period
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: 'rgba(0, 188, 212, 0.15)', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#b0bec5' }}>
                      Return Customer Rate
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5, color: '#00bcd4', fontWeight: 'bold' }}>
                      42.7%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4caf50', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      ↑ 2.8% from previous period
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Insights Section - Always visible */}
      <Grid container spacing={3} mt={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, boxShadow: 4, ...paperStyles }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="#fff">
                Analytics Insights
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{
                    color: '#00bcd4',
                    borderColor: '#00bcd4',
                    mr: 1,
                    '&:hover': {
                      borderColor: '#00acc1',
                      backgroundColor: 'rgba(0, 188, 212, 0.08)'
                    }
                  }}
                >
                  Export Insights
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: '#00bcd4',
                    color: '#fff',
                    boxShadow: '0 2px 6px rgba(0, 188, 212, 0.3)',
                    '&:hover': {
                      backgroundColor: '#00acc1',
                    }
                  }}
                >
                  View All Reports
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.12)' }} />

            {loading ? (
              <Stack spacing={2}>
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
              </Stack>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(0, 188, 212, 0.15)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium" color="#00bcd4">
                      Monthly Revenue Growth
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1, color: '#fff', fontWeight: 'bold' }}>
                      +${insightsData.monthlyRevenueGrowth.value.toLocaleString()} ({insightsData.monthlyRevenueGrowth.percentage}%)
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: '#b0bec5' }}>
                      {insightsData.monthlyRevenueGrowth.description}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(0, 188, 212, 0.15)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium" color="#00bcd4">
                      Customer Retention Rate
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1, color: '#fff', fontWeight: 'bold' }}>
                      {insightsData.customerRetentionRate.value}%
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: '#b0bec5' }}>
                      {insightsData.customerRetentionRate.description}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(0, 188, 212, 0.15)', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium" color="#00bcd4">
                      Avg. Transaction Value
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1, color: '#fff', fontWeight: 'bold' }}>
                      +${insightsData.avgTransactionValue.value} ({insightsData.avgTransactionValue.growth}%)
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: '#b0bec5' }}>
                      {insightsData.avgTransactionValue.description}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight="medium" color="#fff" gutterBottom>
                Key Recommendations
              </Typography>
              <Grid container spacing={2}>
                {insightsData.recommendations.map((recommendation, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        borderLeft: `4px solid ${index % 2 === 0 ? '#00bcd4' : '#4caf50'}`,
                        bgcolor: `rgba(${index % 2 === 0 ? '0, 188, 212' : '76, 175, 80'}, 0.1)`,
                        borderRadius: '0 4px 4px 0'
                      }}
                    >
                      <Typography variant="body2" color="#fff">
                        {recommendation}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: '#1e3a5f',
            color: '#fff',
            boxShadow: '0 3px 10px rgba(0,0,0,0.5)'
          }
        }}
      />
    </Container>
  );
};

export default Analytics;