import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  Grid,
  InputAdornment,
  IconButton,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Search,
  Refresh,
  FileDownload,
  FilterList,
  Visibility,
  TrendingUp,
  TrendingDown,
  People,
  Warning,
  CheckCircle,
  Error,
  Close,
  Phone,
  Email,
  CalendarToday,
  AttachMoney,
  Assessment
} from '@mui/icons-material';

const PredictiveChurn = () => {
  // State cho khách hàng và tìm kiếm
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('Tất cả');
  
  // State cho loading và thông báo
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // State cho dialog chi tiết
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // State cho bộ lọc
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    riskLevel: 'Tất cả',
    segment: 'Tất cả',
    minScore: '',
    maxScore: ''
  });

  // State cho thống kê
  const [stats, setStats] = useState({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    avgChurnScore: 0,
    predictedLoss: 0
  });

  // API URL
  const API_URL = 'http://localhost:5000/api';

  // Lấy dữ liệu khách hàng từ API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          riskLevel: filters.riskLevel !== 'Tất cả' ? filters.riskLevel : undefined,
          minScore: filters.minScore || undefined,
          maxScore: filters.maxScore || undefined,
          segment: filters.segment !== 'Tất cả' ? filters.segment : undefined
        }
      };
      
      // Gọi API thực
      const response = await axios.get(`${API_URL}/churn/predictions`, config);
      
      if (response.data && response.data.length > 0) {
        setCustomers(response.data);
        calculateStats(response.data);
        setNotification({
          open: true,
          message: `Đã tải ${response.data.length} dự đoán churn từ database`,
          severity: 'success'
        });
      } else {
        setCustomers([]);
        calculateStats([]);
        setNotification({
          open: true,
          message: 'Không có dữ liệu churn prediction trong database',
          severity: 'info'
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setNotification({
        open: true,
        message: 'Lỗi kết nối server. Vui lòng kiểm tra backend đang chạy.',
        severity: 'error'
      });
      setCustomers([]);
      calculateStats([]);
      setLoading(false);
    }
  };

  // Tính toán thống kê
  const calculateStats = (data) => {
    const total = data.length;
    const highRisk = data.filter(c => c.riskLevel === 'Cao').length;
    const mediumRisk = data.filter(c => c.riskLevel === 'Trung bình').length;
    const lowRisk = data.filter(c => c.riskLevel === 'Thấp').length;
    const avgScore = data.reduce((sum, c) => sum + c.churnScore, 0) / total;
    const predictedLoss = data.reduce((sum, c) => sum + (c.predictedRevenueLoss || 0), 0);
    
    setStats({
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      avgChurnScore: Math.round(avgScore),
      predictedLoss
    });
  };

  // Gọi API khi component được mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Lọc khách hàng dựa trên tìm kiếm và bộ lọc
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      (customer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesRisk = 
      filterRisk === 'Tất cả' || customer.riskLevel === filterRisk;
    
    const matchesFilterRisk = 
      filters.riskLevel === 'Tất cả' || customer.riskLevel === filters.riskLevel;
    
    const matchesSegment = 
      filters.segment === 'Tất cả' || customer.segment === filters.segment;
    
    const matchesScore = 
      (filters.minScore === '' || customer.churnScore >= parseFloat(filters.minScore)) &&
      (filters.maxScore === '' || customer.churnScore <= parseFloat(filters.maxScore));
    
    return matchesSearch && matchesRisk && matchesFilterRisk && matchesSegment && matchesScore;
  });

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  // Lấy màu cho risk level
  const getRiskColor = (riskLevel) => {
    const colors = {
      'Cao': '#FF6B6B',
      'Trung bình': '#FFA726',
      'Thấp': '#0093AF'
    };
    return colors[riskLevel] || '#B0BEC5';
  };

  // Lấy icon cho risk level
  const getRiskIcon = (riskLevel) => {
    switch(riskLevel) {
      case 'Cao':
        return <Error />;
      case 'Trung bình':
        return <Warning />;
      case 'Thấp':
        return <CheckCircle />;
      default:
        return <CheckCircle />;
    }
  };

  // Lấy màu cho churn score bar
  const getScoreColor = (score) => {
    if (score >= 70) return '#FF6B6B';
    if (score >= 40) return '#FFA726';
    return '#0093AF';
  };

  // Xử lý đóng thông báo
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Xử lý mở dialog chi tiết
  const handleOpenDetailDialog = (customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
  };

  // Xử lý đóng dialog chi tiết
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Xử lý mở dialog bộ lọc
  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  // Xử lý đóng dialog bộ lọc
  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý áp dụng bộ lọc
  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
  };

  // Xử lý đặt lại bộ lọc
  const handleResetFilters = () => {
    setFilters({
      riskLevel: 'Tất cả',
      segment: 'Tất cả',
      minScore: '',
      maxScore: ''
    });
  };

  // Xử lý xuất Excel
  const handleExport = async () => {
    try {
      setNotification({
        open: true,
        message: 'Đang xuất dữ liệu...',
        severity: 'info'
      });
      
      // Trong môi trường thực tế, gọi API
      // const token = localStorage.getItem('token');
      // const response = await axios.get(`${API_URL}/churn/export`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      //   responseType: 'blob'
      // });
      
      // Demo
      setTimeout(() => {
        setNotification({
          open: true,
          message: 'Xuất dữ liệu thành công',
          severity: 'success'
        });
      }, 1000);
    } catch (error) {
      console.error('Error exporting data:', error);
      setNotification({
        open: true,
        message: 'Không thể xuất dữ liệu',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1929 0%, #1a3a52 100%)',
      py: 4 
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ 
          mb: 4, 
          background: 'linear-gradient(135deg, #006994 0%, #0077BE 100%)',
          borderRadius: 3,
          p: 3,
          boxShadow: '0 8px 32px rgba(0, 119, 190, 0.3)'
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Assessment sx={{ fontSize: 40 }} />
            Dự đoán Churn khách hàng
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
            Phân tích và dự đoán khách hàng có nguy cơ rời bỏ
          </Typography>
        </Box>

        {/* Thống kê */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #00A8CC 0%, #00C9DB 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(0, 168, 204, 0.4)',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 30px rgba(0, 168, 204, 0.5)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Tổng khách hàng</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Điểm churn TB: {stats.avgChurnScore}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 30px rgba(255, 107, 107, 0.5)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Error sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Nguy cơ cao</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.highRisk}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cần hành động ngay
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #FFA726 0%, #FFB74D 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(255, 167, 38, 0.4)',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 30px rgba(255, 167, 38, 0.5)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Doanh thu dự kiến mất</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatPrice(stats.predictedLoss)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Trong 6 tháng tới
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #0093AF 0%, #00B4CC 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(0, 147, 175, 0.4)',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 30px rgba(0, 147, 175, 0.5)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Warning sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Nguy cơ trung bình</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.mediumRisk}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Theo dõi và chăm sóc
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #006994 0%, #0077BE 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(0, 105, 148, 0.4)',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 30px rgba(0, 105, 148, 0.5)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Nguy cơ thấp</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.lowRisk}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Khách hàng trung thành
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Thanh tìm kiếm và bộ lọc */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 119, 190, 0.15)',
          border: '2px solid #b3e5fc'
        }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#0077BE' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#0077BE',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0077BE',
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#006994' }}>Mức độ rủi ro</InputLabel>
                  <Select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    label="Mức độ rủi ro"
                    sx={{
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0077BE',
                      }
                    }}
                  >
                    <MenuItem value="Tất cả">Tất cả</MenuItem>
                    <MenuItem value="Cao">Cao</MenuItem>
                    <MenuItem value="Trung bình">Trung bình</MenuItem>
                    <MenuItem value="Thấp">Thấp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={handleOpenFilterDialog}
                    sx={{ 
                      borderColor: '#0077BE',
                      color: '#0077BE',
                      '&:hover': {
                        borderColor: '#006994',
                        backgroundColor: 'rgba(0, 119, 190, 0.08)'
                      }
                    }}
                  >
                    Bộ lọc
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={handleExport}
                    sx={{ 
                      borderColor: '#00A8CC',
                      color: '#00A8CC',
                      '&:hover': {
                        borderColor: '#0093AF',
                        backgroundColor: 'rgba(0, 168, 204, 0.08)'
                      }
                    }}
                  >
                    Xuất Excel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchCustomers}
                    sx={{ 
                      borderColor: '#0093AF',
                      color: '#0093AF',
                      '&:hover': {
                        borderColor: '#006994',
                        backgroundColor: 'rgba(0, 147, 175, 0.08)'
                      }
                    }}
                  >
                    Làm mới
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Bảng khách hàng */}
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 119, 190, 0.15)',
          border: '2px solid #b3e5fc'
        }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#0077BE' }} />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #006994 0%, #0077BE 100%)'
                    }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Khách hàng</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phân khúc</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Điểm Churn</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mức độ rủi ro</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mua hàng gần nhất</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tổng chi tiêu</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Doanh thu dự kiến mất</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow 
                        key={customer.id}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'rgba(0, 119, 190, 0.05)',
                            transition: 'background-color 0.3s ease'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: getRiskColor(customer.riskLevel),
                              width: 40,
                              height: 40
                            }}>
                              {customer.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 600, color: '#006994' }}>
                                {customer.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {customer.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.segment}
                            size="small"
                            sx={{
                              backgroundColor: customer.segment === 'VIP' ? '#FFD700' :
                                             customer.segment === 'Trung thành' ? '#0093AF' :
                                             customer.segment === 'Thường xuyên' ? '#00A8CC' : '#B0BEC5',
                              color: 'white',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: getScoreColor(customer.churnScore) }}>
                                {customer.churnScore}%
                              </Typography>
                              {customer.churnScore >= 70 ? <TrendingUp sx={{ fontSize: 18, color: '#FF6B6B' }} /> :
                               customer.churnScore >= 40 ? <TrendingDown sx={{ fontSize: 18, color: '#FFA726' }} /> :
                               <TrendingDown sx={{ fontSize: 18, color: '#0093AF' }} />}
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={customer.churnScore}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#E0E0E0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getScoreColor(customer.churnScore),
                                  borderRadius: 3
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.riskLevel}
                            size="small"
                            icon={getRiskIcon(customer.riskLevel)}
                            sx={{
                              backgroundColor: getRiskColor(customer.riskLevel),
                              color: 'white',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 16, color: '#666' }} />
                            <Typography variant="body2">
                              {new Date(customer.lastPurchase).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#0077BE', fontWeight: 600 }}>
                          {formatPrice(customer.totalSpent)}
                        </TableCell>
                        <TableCell sx={{ color: '#FF6B6B', fontWeight: 600 }}>
                          {formatPrice(customer.predictedRevenueLoss)}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Xem chi tiết">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDetailDialog(customer)}
                              sx={{ 
                                color: '#0077BE',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 119, 190, 0.1)'
                                }
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Dialog chi tiết khách hàng */}
        <Dialog
          open={detailDialogOpen}
          onClose={handleCloseDetailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: '2px solid #b3e5fc'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #006994 0%, #0077BE 100%)',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            Chi tiết dự đoán Churn
            <IconButton 
              onClick={handleCloseDetailDialog}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedCustomer && (
              <Box>
                {/* Thông tin khách hàng */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 119, 190, 0.05)', borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: getRiskColor(selectedCustomer.riskLevel),
                          width: 60,
                          height: 60,
                          fontSize: 24
                        }}>
                          {selectedCustomer.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006994' }}>
                            {selectedCustomer.name}
                          </Typography>
                          <Chip
                            label={selectedCustomer.segment}
                            size="small"
                            sx={{
                              backgroundColor: selectedCustomer.segment === 'VIP' ? '#FFD700' : '#0093AF',
                              color: 'white',
                              mt: 0.5
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Email sx={{ color: '#0077BE', fontSize: 20 }} />
                        <Typography variant="body2">{selectedCustomer.email}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Phone sx={{ color: '#0077BE', fontSize: 20 }} />
                        <Typography variant="body2">{selectedCustomer.phone}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Điểm Churn */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#006994' }}>
                    Phân tích Churn
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 107, 107, 0.05)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Điểm Churn:
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: getScoreColor(selectedCustomer.churnScore) }}>
                        {selectedCustomer.churnScore}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={selectedCustomer.churnScore}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#E0E0E0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(selectedCustomer.churnScore),
                          borderRadius: 5
                        }
                      }}
                    />
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={`Mức độ rủi ro: ${selectedCustomer.riskLevel}`}
                        icon={getRiskIcon(selectedCustomer.riskLevel)}
                        sx={{
                          backgroundColor: getRiskColor(selectedCustomer.riskLevel),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Thống kê */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#006994' }}>
                    Thông tin giao dịch
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'rgba(0, 168, 204, 0.1)', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                          Tổng chi tiêu
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0077BE' }}>
                          {formatPrice(selectedCustomer.totalSpent)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'rgba(255, 107, 107, 0.1)', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                          Doanh thu dự kiến mất
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF6B6B' }}>
                          {formatPrice(selectedCustomer.predictedRevenueLoss)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: 'rgba(0, 147, 175, 0.1)', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                          Lần mua hàng gần nhất
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0093AF' }}>
                          {new Date(selectedCustomer.lastPurchase).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Các yếu tố ảnh hưởng */}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#006994' }}>
                    Các yếu tố ảnh hưởng
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedCustomer.factors.map((factor, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          p: 1.5, 
                          bgcolor: 'rgba(255, 167, 38, 0.1)', 
                          borderRadius: 1,
                          borderLeft: '4px solid #FFA726'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          • {factor}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Khuyến nghị hành động */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 119, 190, 0.1)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#006994' }}>
                    Khuyến nghị hành động
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedCustomer.riskLevel === 'Cao' && (
                      <>
                        <Typography variant="body2">• Liên hệ ngay với khách hàng qua điện thoại</Typography>
                        <Typography variant="body2">• Cung cấp ưu đãi đặc biệt hoặc chương trình loyalty</Typography>
                        <Typography variant="body2">• Tìm hiểu nguyên nhân không hài lòng và giải quyết</Typography>
                      </>
                    )}
                    {selectedCustomer.riskLevel === 'Trung bình' && (
                      <>
                        <Typography variant="body2">• Gửi email cá nhân hóa với sản phẩm phù hợp</Typography>
                        <Typography variant="body2">• Nhắc nhở về các lợi ích của chương trình thành viên</Typography>
                        <Typography variant="body2">• Theo dõi hoạt động và tương tác trong 30 ngày tới</Typography>
                      </>
                    )}
                    {selectedCustomer.riskLevel === 'Thấp' && (
                      <>
                        <Typography variant="body2">• Duy trì chất lượng dịch vụ hiện tại</Typography>
                        <Typography variant="body2">• Gửi thông tin về sản phẩm mới phù hợp</Typography>
                        <Typography variant="body2">• Khuyến khích giới thiệu bạn bè với ưu đãi</Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleCloseDetailDialog}
              sx={{ 
                color: '#006994',
                '&:hover': {
                  backgroundColor: 'rgba(0, 105, 148, 0.08)'
                }
              }}
            >
              Đóng
            </Button>
            <Button
              variant="contained"
              startIcon={<Phone />}
              sx={{ 
                background: 'linear-gradient(135deg, #0077BE 0%, #00A8CC 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #006994 0%, #0093AF 100%)',
                }
              }}
            >
              Liên hệ khách hàng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog bộ lọc */}
        <Dialog
          open={filterDialogOpen}
          onClose={handleCloseFilterDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: '2px solid #b3e5fc'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #006994 0%, #0077BE 100%)',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            Bộ lọc chi tiết
            <IconButton 
              onClick={handleCloseFilterDialog}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel sx={{ '&.Mui-focused': { color: '#0077BE' } }}>Mức độ rủi ro</InputLabel>
                  <Select
                    name="riskLevel"
                    value={filters.riskLevel}
                    onChange={handleFilterChange}
                    label="Mức độ rủi ro"
                    sx={{
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0077BE',
                      }
                    }}
                  >
                    <MenuItem value="Tất cả">Tất cả</MenuItem>
                    <MenuItem value="Cao">Cao</MenuItem>
                    <MenuItem value="Trung bình">Trung bình</MenuItem>
                    <MenuItem value="Thấp">Thấp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel sx={{ '&.Mui-focused': { color: '#0077BE' } }}>Phân khúc</InputLabel>
                  <Select
                    name="segment"
                    value={filters.segment}
                    onChange={handleFilterChange}
                    label="Phân khúc"
                    sx={{
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0077BE',
                      }
                    }}
                  >
                    <MenuItem value="Tất cả">Tất cả</MenuItem>
                    <MenuItem value="VIP">VIP</MenuItem>
                    <MenuItem value="Trung thành">Trung thành</MenuItem>
                    <MenuItem value="Thường xuyên">Thường xuyên</MenuItem>
                    <MenuItem value="Mới">Mới</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Điểm Churn tối thiểu"
                  name="minScore"
                  type="number"
                  value={filters.minScore}
                  onChange={handleFilterChange}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#0077BE',
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#0077BE',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Điểm Churn tối đa"
                  name="maxScore"
                  type="number"
                  value={filters.maxScore}
                  onChange={handleFilterChange}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#0077BE',
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#0077BE',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleResetFilters}
              sx={{ 
                color: '#006994',
                '&:hover': {
                  backgroundColor: 'rgba(0, 105, 148, 0.08)'
                }
              }}
            >
              Đặt lại
            </Button>
            <Button 
              onClick={handleCloseFilterDialog}
              sx={{ 
                color: '#006994',
                '&:hover': {
                  backgroundColor: 'rgba(0, 105, 148, 0.08)'
                }
              }}
            >
              Hủy
            </Button>
            <Button 
              variant="contained" 
              onClick={handleApplyFilters}
              sx={{ 
                background: 'linear-gradient(135deg, #0077BE 0%, #00A8CC 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #006994 0%, #0093AF 100%)',
                }
              }}
            >
              Áp dụng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar thông báo */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 20px rgba(0, 119, 190, 0.3)',
              '& .MuiAlert-icon': {
                color: notification.severity === 'success' ? '#0093AF' : undefined
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default PredictiveChurn;