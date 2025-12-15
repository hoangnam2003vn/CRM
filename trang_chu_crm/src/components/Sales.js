import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Các giai đoạn bán hàng với màu sắc
const SALES_STAGES = [
  { name: 'Khám phá', color: '#9e9e9e' }, // Xám
  { name: 'Đủ điều kiện', color: '#2196f3' }, // Xanh dương
  { name: 'Đề xuất', color: '#ff9800' }, // Cam
  { name: 'Đàm phán', color: '#9c27b0' }, // Tím
  { name: 'Đã đóng (Thắng)', color: '#4caf50' }, // Xanh lá
  { name: 'Đã đóng (Thua)', color: '#f44336' } // Đỏ
];

// Định dạng tiền tệ
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Component chính
const Sales = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [currentOpportunity, setCurrentOpportunity] = useState(null);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  // Tính toán tổng kết
  const totalOpportunities = opportunities.length;
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
  const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
  const closedWon = opportunities.filter(opp => opp.stage === 'Đã đóng (Thắng)').reduce((sum, opp) => sum + opp.value, 0);

  // Pipeline theo giai đoạn
  const pipelineByStage = SALES_STAGES.map(stage => {
    const stageOpps = opportunities.filter(opp => opp.stage === stage.name);
    return {
      ...stage,
      count: stageOpps.length,
      value: stageOpps.reduce((sum, opp) => sum + opp.value, 0)
    };
  });

  // Fetch activities từ API
  const fetchActivities = async () => {
    try {
      setPageLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách hoạt động');
      }

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setPageLoading(false);
    }
  };

  // Fetch opportunities từ API
  const fetchOpportunities = async () => {
    try {
      setPageLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/opportunities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách cơ hội');
      }

      const data = await response.json();
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setPageLoading(false);
    }
  };

  // Load activities khi component mount
  useEffect(() => {
    fetchActivities();
    fetchOpportunities();
  }, []);

  // Xử lý thay đổi tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date để hiển thị
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Mở hộp thoại thêm/sửa cơ hội
  const handleOpenDialog = (opportunity = null) => {
    setCurrentOpportunity(opportunity || {
      id: opportunities.length + 1,
      name: '',
      customer: '',
      value: 0,
      stage: 'Khám phá',
      probability: 10,
      expectedCloseDate: new Date().toISOString().split('T')[0],
      assignedTo: '',
      activity: new Date().toISOString().split('T')[0]
    });
    setOpenDialog(true);
  };

  // Mở hộp thoại thêm/sửa hoạt động
  const handleOpenActivityDialog = (activity = null) => {
    setCurrentActivity(activity || {
      id: activities.length + 1,
      type: 'Gọi điện',
      description: '',
      date: new Date().toISOString().split('T')[0],
      relatedTo: '',
      assignedTo: '',
      status: 'Đang chờ'
    });
    setOpenActivityDialog(true);
  };

  // Xử lý đóng hộp thoại
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Xử lý đóng hộp thoại hoạt động
  const handleCloseActivityDialog = () => {
    setOpenActivityDialog(false);
  };

  // Xử lý thay đổi form cơ hội
  const handleOpportunityChange = (e) => {
    const { name, value } = e.target;
    setCurrentOpportunity({
      ...currentOpportunity,
      [name]: name === 'value' || name === 'probability' ? Number(value) : value
    });
  };

  // Xử lý thay đổi form hoạt động
  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setCurrentActivity({
      ...currentActivity,
      [name]: value
    });
  };

  // Lưu cơ hội 
  const handleSaveOpportunity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Validation
      if (!currentOpportunity.name || !currentOpportunity.customer || !currentOpportunity.value || !currentOpportunity.assignedTo) {
        alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
        setLoading(false);
        return;
      }

      const url = currentOpportunity._id
        ? `${API_BASE_URL}/opportunities/update/${currentOpportunity._id}`
        : `${API_BASE_URL}/opportunities/add`;

      const method = currentOpportunity._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentOpportunity)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra');
      }

      const result = await response.json();

      // Refresh danh sách opportunities
      await fetchOpportunities();

      setOpenDialog(false);
      setCurrentOpportunity(null);
      alert(result.message || 'Lưu cơ hội thành công');

    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Lỗi khi lưu cơ hội: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Lưu hoạt động 
  const handleSaveActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Validation
      if (!currentActivity.description || !currentActivity.relatedTo || !currentActivity.assignedTo) {
        alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
        setLoading(false);
        return;
      }

      const url = currentActivity._id
        ? `${API_BASE_URL}/activities/update/${currentActivity._id}`
        : `${API_BASE_URL}/activities/add`;

      const method = currentActivity._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentActivity)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra');
      }

      const result = await response.json();

      // Refresh danh sách activities
      await fetchActivities();

      setOpenActivityDialog(false);
      setCurrentActivity(null);
      alert(result.message || 'Lưu hoạt động thành công');

    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Lỗi khi lưu hoạt động: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Xóa cơ hội
  const handleDeleteOpportunity = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa cơ hội này không?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/opportunities/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra');
      }

      const result = await response.json();

      // Refresh danh sách opportunities
      await fetchOpportunities();
      alert(result.message || 'Xóa cơ hội thành công');

    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('Lỗi khi xóa cơ hội: ' + error.message);
    }
  };

  // Xóa hoạt động
  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa hoạt động này không?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/activities/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra');
      }

      const result = await response.json();

      // Refresh danh sách activities
      await fetchActivities();
      alert(result.message || 'Xóa hoạt động thành công');

    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Lỗi khi xóa hoạt động: ' + error.message);
    }
  };

  // Header với gradient và thông tin tổng quan
  const renderHeader = () => {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0a4d68 0%, #05BFDB 100%)',
          borderRadius: 2,
          p: 4,
          mb: 3,
          color: 'white'
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Quản lý bán hàng
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Quản lý tất cả các cơ hội và hoạt động bán hàng của doanh nghiệp
        </Typography>
      </Box>
    );
  };

  // Thẻ thống kê với icon và màu sắc
  const renderStatsCards = () => {
    const stats = [
      {
        icon: <BusinessIcon sx={{ fontSize: 40 }} />,
        title: 'Tổng số cơ hội',
        value: totalOpportunities,
        subtitle: 'Tất cả cơ hội trong hệ thống',
        color: '#05BFDB'
      },
      {
        icon: <PaymentIcon sx={{ fontSize: 40 }} />,
        title: 'Tổng giá trị',
        value: formatCurrency(totalValue),
        subtitle: 'Tổng giá trị giao dịch',
        color: '#05BFDB'
      },
      {
        icon: <PendingIcon sx={{ fontSize: 40 }} />,
        title: 'Đang xử lý',
        value: `${Math.round(weightedValue)} đ`,
        subtitle: 'Tổng giá trị giao dịch đang xử lý',
        color: '#05BFDB'
      },
      {
        icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
        title: 'Đã hoàn thành',
        value: formatCurrency(closedWon),
        subtitle: 'Tổng giá trị giao dịch đã hoàn thành',
        color: '#05BFDB'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                background: '#164863',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #1e5a7a',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 24px rgba(5, 191, 219, 0.3)',
                  borderColor: '#05BFDB'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: `${stat.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                    mr: 2
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#9DB2BF' }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9DB2BF' }}>
                    {stat.subtitle}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Thanh tìm kiếm và các nút chức năng
  const renderToolbar = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
          width: '100%'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <TextField
            placeholder="Tìm theo tên khách hàng hoặc cơ hội..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: 250,
              maxWidth: 400,
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#164863',
                color: 'white',
                '& fieldset': {
                  borderColor: '#1e5a7a',
                },
                '&:hover fieldset': {
                  borderColor: '#05BFDB',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#05BFDB',
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#9DB2BF',
                opacity: 1
              }
            }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9DB2BF' }} />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            size="small"
            sx={{
              borderColor: '#1e5a7a',
              color: '#05BFDB',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#05BFDB',
                backgroundColor: '#164863',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(5, 191, 219, 0.3)'
              }
            }}
          >
            BỘ LỌC
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => tabValue === 1 ? handleOpenDialog() : handleOpenActivityDialog()}
            sx={{
              background: '#05BFDB',
              color: '#0a2540',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: '#04a5c0',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(5, 191, 219, 0.4)'
              }
            }}
          >
            {tabValue === 1 ? 'THÊM CƠ HỘI' : 'THÊM HOẠT ĐỘNG'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            size="small"
            sx={{
              borderColor: '#1e5a7a',
              color: '#05BFDB',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#05BFDB',
                backgroundColor: '#164863',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(5, 191, 219, 0.3)'
              }
            }}
          >
            XUẤT EXCEL
          </Button>
          <IconButton 
            onClick={() => tabValue === 1 ? fetchOpportunities() : fetchActivities()}
            sx={{ 
              color: '#05BFDB',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#05BFDB',
                color: '#0a2540',
                transform: 'rotate(180deg) scale(1.1)'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  // Bảng cơ hội với style mới
  const renderOpportunitiesTable = () => {
    const filteredOpportunities = opportunities.filter(opp =>
      opp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.customer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Paper sx={{ 
        borderRadius: 2, 
        overflow: 'hidden', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        width: '100%',
        backgroundColor: '#164863',
        border: '1px solid #1e5a7a'
      }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #1e5a7a', fontWeight: 'bold', color: 'white' }}>
          Danh sách cơ hội
        </Typography>
        <TableContainer sx={{ maxWidth: '100%', overflow: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ backgroundColor: '#0a3a52' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 150, color: '#9DB2BF' }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 140, color: '#9DB2BF' }}>Số tiền</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Phương thức</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 100, color: '#9DB2BF' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOpportunities.length > 0 ? (
                filteredOpportunities.map((opp, index) => (
                  <TableRow 
                    key={opp._id} 
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: '#1a4a62',
                        transform: 'scale(1.01)',
                        boxShadow: '0 4px 12px rgba(5, 191, 219, 0.2)',
                        cursor: 'pointer'
                      },
                      borderBottom: '1px solid #1e5a7a',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#9DB2BF' }}>
                      {opp._id?.slice(-12) || `fc369853f79${index + 1}`}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: 'white' }}>{opp.customer}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#05BFDB' }}>
                      {formatCurrency(opp.value)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={opp.name}
                        size="small"
                        sx={{
                          backgroundColor: '#0a3a52',
                          color: '#05BFDB',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#05BFDB',
                            color: '#0a2540',
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ color: '#05BFDB', fontSize: 16 }} />
                        <Chip
                          label="Đã hoàn thành"
                          size="small"
                          sx={{
                            backgroundColor: '#0a3a52',
                            color: '#05BFDB',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#05BFDB',
                              color: '#0a2540',
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#9DB2BF' }}>{formatDate(opp.expectedCloseDate)}</TableCell>
                    <TableCell sx={{ color: '#9DB2BF' }}>{opp.assignedTo}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(opp)}
                          sx={{ 
                            color: '#05BFDB',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#05BFDB',
                              color: '#0a2540',
                              transform: 'scale(1.2)'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteOpportunity(opp._id)}
                          sx={{ 
                            color: '#ff6b6b',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#ff6b6b',
                              color: 'white',
                              transform: 'scale(1.2)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: '#9DB2BF' }}>
                      Chưa có cơ hội bán hàng nào. Nhấn "Thêm cơ hội" để tạo mới.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  // Bảng hoạt động với style mới
  const renderActivitiesTable = () => {
    const filteredActivities = activities.filter(act =>
      act.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.relatedTo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (pageLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#05BFDB' }} />
        </Box>
      );
    }

    return (
      <Paper sx={{ 
        borderRadius: 2, 
        overflow: 'hidden', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        width: '100%',
        backgroundColor: '#164863',
        border: '1px solid #1e5a7a'
      }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #1e5a7a', fontWeight: 'bold', color: 'white' }}>
          Danh sách hoạt động
        </Typography>
        <TableContainer sx={{ maxWidth: '100%', overflow: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ backgroundColor: '#0a3a52' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 150, color: '#9DB2BF' }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 200, color: '#9DB2BF' }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120, color: '#9DB2BF' }}>Phương thức</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 100, color: '#9DB2BF' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act, index) => (
                  <TableRow 
                    key={act._id} 
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: '#1a4a62',
                        transform: 'scale(1.01)',
                        boxShadow: '0 4px 12px rgba(5, 191, 219, 0.2)',
                        cursor: 'pointer'
                      },
                      borderBottom: '1px solid #1e5a7a',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#9DB2BF' }}>
                      {act._id?.slice(-12) || `fc369853f79${index + 1}`}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: 'white' }}>{act.relatedTo}</TableCell>
                    <TableCell sx={{ color: '#9DB2BF' }}>{act.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={act.type}
                        size="small"
                        sx={{
                          backgroundColor: '#0a3a52',
                          color: '#05BFDB',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#05BFDB',
                            color: '#0a2540',
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ color: '#05BFDB', fontSize: 16 }} />
                        <Chip
                          label={act.status}
                          size="small"
                          sx={{
                            backgroundColor: '#0a3a52',
                            color: act.status === 'Hoàn thành' ? '#05BFDB' :
                              act.status === 'Đang chờ' ? '#ffa726' : '#05BFDB',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: act.status === 'Hoàn thành' ? '#05BFDB' :
                                act.status === 'Đang chờ' ? '#ffa726' : '#05BFDB',
                              color: '#0a2540',
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#9DB2BF' }}>{formatDate(act.date)}</TableCell>
                    <TableCell sx={{ color: '#9DB2BF' }}>{act.assignedTo}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenActivityDialog(act)}
                          sx={{ 
                            color: '#05BFDB',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#05BFDB',
                              color: '#0a2540',
                              transform: 'scale(1.2)'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteActivity(act._id)}
                          sx={{ 
                            color: '#ff6b6b',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#ff6b6b',
                              color: 'white',
                              transform: 'scale(1.2)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: '#9DB2BF' }}>
                      Chưa có hoạt động bán hàng nào. Nhấn "Thêm hoạt động" để tạo mới.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  // Form dialog thêm/sửa cơ hội
  const renderOpportunityDialog = () => {
    return (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#164863',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #1e5a7a' }}>
          {currentOpportunity?._id ? 'Sửa cơ hội bán hàng' : 'Thêm cơ hội bán hàng'}
          <IconButton
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8, 
              color: '#9DB2BF',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#ff6b6b',
                backgroundColor: '#0a3a52',
                transform: 'rotate(90deg)'
              }
            }}
            onClick={handleCloseDialog}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#1e5a7a' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Tên cơ hội"
                name="name"
                value={currentOpportunity?.name || ''}
                onChange={handleOpportunityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Khách hàng"
                name="customer"
                value={currentOpportunity?.customer || ''}
                onChange={handleOpportunityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Giá trị (VND)"
                name="value"
                type="number"
                value={currentOpportunity?.value || 0}
                onChange={handleOpportunityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                margin="dense"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#9DB2BF',
                  }
                }}
              >
                <InputLabel>Giai đoạn</InputLabel>
                <Select
                  name="stage"
                  value={currentOpportunity?.stage || 'Khám phá'}
                  onChange={handleOpportunityChange}
                  label="Giai đoạn"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#164863',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            backgroundColor: '#1a4a62',
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#0a3a52',
                            '&:hover': {
                              backgroundColor: '#1a4a62',
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  {SALES_STAGES.map((stage) => (
                    <MenuItem key={stage.name} value={stage.name}>
                      {stage.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Xác suất (%)"
                name="probability"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={currentOpportunity?.probability || 0}
                onChange={handleOpportunityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Ngày dự kiến đóng"
                name="expectedCloseDate"
                type="date"
                value={currentOpportunity?.expectedCloseDate ? currentOpportunity.expectedCloseDate.split('T')[0] : ''}
                onChange={handleOpportunityChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Người phụ trách"
                name="assignedTo"
                value={currentOpportunity?.assignedTo || ''}
                onChange={handleOpportunityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #1e5a7a' }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              color: '#9DB2BF',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#05BFDB',
                backgroundColor: '#0a3a52'
              }
            }}
          >Hủy</Button>
          <Button
            onClick={handleSaveOpportunity}
            variant="contained"
            disabled={loading}
            sx={{
              background: '#05BFDB',
              color: '#0a2540',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: '#04a5c0',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(5, 191, 219, 0.4)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Form dialog thêm/sửa hoạt động
  const renderActivityDialog = () => {
    return (
      <Dialog 
        open={openActivityDialog} 
        onClose={handleCloseActivityDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#164863',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #1e5a7a' }}>
          {currentActivity?._id ? 'Sửa hoạt động bán hàng' : 'Thêm hoạt động bán hàng'}
          <IconButton
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8, 
              color: '#9DB2BF',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#ff6b6b',
                backgroundColor: '#0a3a52',
                transform: 'rotate(90deg)'
              }
            }}
            onClick={handleCloseActivityDialog}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#1e5a7a' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                margin="dense"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#9DB2BF',
                  }
                }}
              >
                <InputLabel>Loại hoạt động</InputLabel>
                <Select
                  name="type"
                  value={currentActivity?.type || 'Gọi điện'}
                  onChange={handleActivityChange}
                  label="Loại hoạt động"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#164863',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            backgroundColor: '#1a4a62',
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#0a3a52',
                            '&:hover': {
                              backgroundColor: '#1a4a62',
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="Gọi điện">Gọi điện</MenuItem>
                  <MenuItem value="Họp">Họp</MenuItem>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Demo">Demo</MenuItem>
                  <MenuItem value="Theo dõi">Theo dõi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Ngày"
                name="date"
                type="date"
                value={currentActivity?.date || ''}
                onChange={handleActivityChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Mô tả"
                name="description"
                multiline
                rows={2}
                value={currentActivity?.description || ''}
                onChange={handleActivityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Liên quan đến"
                name="relatedTo"
                value={currentActivity?.relatedTo || ''}
                onChange={handleActivityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Người phụ trách"
                name="assignedTo"
                value={currentActivity?.assignedTo || ''}
                onChange={handleActivityChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl 
                fullWidth 
                margin="dense"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#1e5a7a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#05BFDB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#05BFDB',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9DB2BF',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#05BFDB',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#9DB2BF',
                  }
                }}
              >
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={currentActivity?.status || 'Đang chờ'}
                  onChange={handleActivityChange}
                  label="Trạng thái"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#164863',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            backgroundColor: '#1a4a62',
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#0a3a52',
                            '&:hover': {
                              backgroundColor: '#1a4a62',
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="Đang chờ">Đang chờ</MenuItem>
                  <MenuItem value="Đã lên lịch">Đã lên lịch</MenuItem>
                  <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
                  <MenuItem value="Hủy">Hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #1e5a7a' }}>
          <Button 
            onClick={handleCloseActivityDialog} 
            sx={{ 
              color: '#9DB2BF',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#05BFDB',
                backgroundColor: '#0a3a52'
              }
            }}
          >Hủy</Button>
          <Button
            onClick={handleSaveActivity}
            variant="contained"
            disabled={loading}
            sx={{
              background: '#05BFDB',
              color: '#0a2540',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: '#04a5c0',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(5, 191, 219, 0.4)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: '#0a2540', 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      {renderHeader()}
      {renderStatsCards()}
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ 
          mb: 3, 
          '& .MuiTabs-indicator': {
            backgroundColor: '#05BFDB',
            height: 3
          },
          '& .MuiTab-root': {
            fontWeight: 'bold',
            color: '#9DB2BF',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#05BFDB',
              backgroundColor: '#164863'
            }
          },
          '& .Mui-selected': {
            color: '#05BFDB !important'
          }
        }}
      >
        <Tab icon={<MoneyIcon />} iconPosition="start" label="Tổng quan bán hàng" />
        <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Cơ hội" />
        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Hoạt động" />
      </Tabs>

      {renderToolbar()}

      {/* Tab Tổng quan */}
      {tabValue === 0 && (
        <>
          {renderOpportunitiesTable()}
        </>
      )}

      {/* Tab Cơ hội */}
      {tabValue === 1 && (
        <>
          {renderOpportunitiesTable()}
        </>
      )}

      {/* Tab Hoạt động */}
      {tabValue === 2 && (
        <>
          {renderActivitiesTable()}
        </>
      )}

      {/* Các dialog */}
      {renderOpportunityDialog()}
      {renderActivityDialog()}
    </Box>
  );
};

export default Sales;