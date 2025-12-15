import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Stack,
  Tooltip,
  Badge,
  InputAdornment,
  LinearProgress,
  Container,
  Alert,
  Snackbar,
  CircularProgress,
  Backdrop
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Assignment,
  Visibility,
  AttachMoney,
  Person,
  CalendarToday,
  CheckCircle,
  Schedule,
  Cancel,
  Warning,
  Download,
  Send,
  TrendingUp,
  Description,
  Business,
  Refresh
} from '@mui/icons-material';

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    active: 0,
    pending: 0,
    completed: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [contractForm, setContractForm] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    value: '',
    startDate: '',
    endDate: '',
    type: 'Service',
    priority: 'Medium',
    description: ''
  });

  const contractTypes = ['Service', 'Product', 'Consulting', 'Maintenance', 'Other'];
  const contractStatuses = ['Active', 'Pending', 'Completed', 'Cancelled', 'Draft'];
  const priorities = ['High', 'Medium', 'Low'];

  // API Functions
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const apiCall = async (url, options = {}) => {
    const token = getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`/api/contracts${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  };

  // Load contracts and stats
  const loadContracts = async () => {
    try {
      setLoading(true);
      const contractsData = await apiCall('/', {
        method: 'GET'
      });
      setContracts(contractsData);
    } catch (err) {
      setError('Lỗi khi tải danh sách hợp đồng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await apiCall('/stats/summary', {
        method: 'GET'
      });
      if (statsData && typeof statsData === 'object') {
        setStats(statsData);
      }
    } catch (err) {
      // Silently handle - stats sẽ dùng giá trị mặc định
      console.warn('Stats API not available, using defaults');
    }
  };

  // CRUD Operations
  const handleSaveContract = async () => {
    try {
      setLoading(true);
      
      if (editingContract) {
        // Update existing contract
        const updatedContract = await apiCall(`/update/${editingContract._id}`, {
          method: 'PUT',
          body: JSON.stringify(contractForm)
        });
        setSuccess('Cập nhật hợp đồng thành công!');
      } else {
        // Create new contract
        const newContract = await apiCall('/add', {
          method: 'POST',
          body: JSON.stringify(contractForm)
        });
        setSuccess('Tạo hợp đồng mới thành công!');
      }
      
      handleCloseDialog();
      await loadContracts();
      await loadStats();
    } catch (err) {
      setError('Lỗi khi lưu hợp đồng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
      return;
    }

    try {
      setLoading(true);
      await apiCall(`/delete/${id}`, {
        method: 'DELETE'
      });
      setSuccess('Xóa hợp đồng thành công!');
      await loadContracts();
      await loadStats();
    } catch (err) {
      setError('Lỗi khi xóa hợp đồng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contracts/export/excel', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Lỗi khi xuất Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'danh-sach-hop-dong.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Xuất Excel thành công!');
    } catch (err) {
      setError('Lỗi khi xuất Excel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const searchMatch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatus === '' || contract.status === filterStatus;
    const typeMatch = filterType === '' || contract.type === filterType;
    
    return searchMatch && statusMatch && typeMatch;
  });

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Pending': return 'warning';
      case 'Completed': return 'info';
      case 'Cancelled': return 'error';
      case 'Draft': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <CheckCircle fontSize="small" />;
      case 'Pending': return <Schedule fontSize="small" />;
      case 'Completed': return <CheckCircle fontSize="small" />;
      case 'Cancelled': return <Cancel fontSize="small" />;
      case 'Draft': return <Assignment fontSize="small" />;
      default: return <Assignment fontSize="small" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Service': return <Business sx={{ color: 'white', fontSize: 20 }} />;
      case 'Product': return <Assignment sx={{ color: 'white', fontSize: 20 }} />;
      case 'Consulting': return <Person sx={{ color: 'white', fontSize: 20 }} />;
      case 'Maintenance': return <CheckCircle sx={{ color: 'white', fontSize: 20 }} />;
      case 'Other': return <Description sx={{ color: 'white', fontSize: 20 }} />;
      default: return <Description sx={{ color: 'white', fontSize: 20 }} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Dialog handlers
  const handleOpenDialog = (contract = null) => {
    if (contract) {
      setEditingContract(contract);
      setContractForm({
        title: contract.title || '',
        clientName: contract.clientName || '',
        clientEmail: contract.clientEmail || '',
        value: contract.value || '',
        startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
        endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
        type: contract.type || 'Service',
        priority: contract.priority || 'Medium',
        description: contract.description || ''
      });
    } else {
      setEditingContract(null);
      setContractForm({
        title: '',
        clientName: '',
        clientEmail: '',
        value: '',
        startDate: '',
        endDate: '',
        type: 'Service',
        priority: 'Medium',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContract(null);
  };

  // Load data on component mount
  useEffect(() => {
    loadContracts();
    loadStats();
  }, []);

  return (
    <Box sx={{ 
      backgroundColor: '#0f1419', 
      minHeight: '100vh', 
      width: '100%',
      backgroundImage: 'linear-gradient(to bottom, #0f1419 0%, #1a2332 100%)'
    }}>
      <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
        {/* Loading Backdrop */}
        <Backdrop
          sx={{ color: '#00d4ff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography 
              variant="h3" 
              fontWeight="bold" 
              sx={{ 
                color: '#00d4ff',
                mb: 1,
                textShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
              }}
            >
              Quản lý hợp đồng
            </Typography>
            <Typography variant="body1" sx={{ color: '#7b8a9a' }}>
              Theo dõi hiệu suất kinh doanh của bạn
            </Typography>
          </Box>

          {/* Alert Box - only show when error */}
          {contracts.length === 0 && !loading && (
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: '#0288d1',
              color: 'white',
              border: 'none',
              '& .MuiAlert-icon': {
                color: 'white'
              }
            }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => {
                  loadContracts();
                  loadStats();
                }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            }
          >
            Chưa có dữ liệu hợp đồng. Nhấn refresh hoặc tạo hợp đồng mới.
          </Alert>
          )}
        </Box>

        {/* Enhanced Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Contracts */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              backgroundColor: '#1e2836',
              border: '1px solid #2a3644',
              borderRadius: 2,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0, 212, 255, 0.15)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#00d4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Person sx={{ color: '#0f1419', fontSize: 24 }} />
                  </Box>
                  <Chip 
                    label="+0.0%" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      color: '#00d4ff',
                      fontWeight: 'bold',
                      border: '1px solid rgba(0, 212, 255, 0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7b8a9a' }}>
                  Tổng hợp đồng
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Value */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              backgroundColor: '#1e2836',
              border: '1px solid #2a3644',
              borderRadius: 2,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0, 212, 255, 0.15)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#00d4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AttachMoney sx={{ color: '#0f1419', fontSize: 24 }} />
                  </Box>
                  <Chip 
                    label="+0.0%" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      color: '#00d4ff',
                      fontWeight: 'bold',
                      border: '1px solid rgba(0, 212, 255, 0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                  {formatCurrency(stats.totalValue)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7b8a9a' }}>
                  Tổng doanh thu
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Contracts */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              backgroundColor: '#1e2836',
              border: '1px solid #2a3644',
              borderRadius: 2,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0, 212, 255, 0.15)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#00d4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp sx={{ color: '#0f1419', fontSize: 24 }} />
                  </Box>
                  <Chip 
                    label="+0.0%" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      color: '#00d4ff',
                      fontWeight: 'bold',
                      border: '1px solid rgba(0, 212, 255, 0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7b8a9a' }}>
                  KH năm nay
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Conversion Rate */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              backgroundColor: '#1e2836',
              border: '1px solid #2a3644',
              borderRadius: 2,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0, 212, 255, 0.15)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#00d4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Business sx={{ color: '#0f1419', fontSize: 24 }} />
                  </Box>
                  <Chip 
                    label="+0.0%" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      color: '#00d4ff',
                      fontWeight: 'bold',
                      border: '1px solid rgba(0, 212, 255, 0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                  {stats.pending > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </Typography>
                <Typography variant="body2" sx={{ color: '#7b8a9a' }}>
                  Tỉ lệ chuyển đổi
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section - All 3 in one row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Revenue Chart */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              backgroundColor: '#1e2836',
              border: '1px solid #2a3644',
              borderRadius: 2,
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Biểu đồ doanh thu
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip 
                    label="Doanh thu" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(0, 123, 255, 0.2)',
                      color: '#007bff',
                      border: '1px solid rgba(0, 123, 255, 0.4)'
                    }}
                  />
                  <Chip 
                    label="Chi phí" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(220, 53, 69, 0.2)',
                      color: '#dc3545',
                      border: '1px solid rgba(220, 53, 69, 0.4)'
                    }}
                  />
                </Stack>
                <Box sx={{ 
                  height: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px dashed #2a3644',
                  borderRadius: 2
                }}>
                  <Typography sx={{ color: '#7b8a9a' }}>
                    Chưa có dữ liệu
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* VIP Customers */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              backgroundColor: '#1e2836',
              border: '1px solid #2a3644',
              borderRadius: 2,
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Khách hàng VIP
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#00d4ff', 
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    XEM TẤT CẢ
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 222, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px dashed #2a3644',
                  borderRadius: 2
                }}>
                  <Typography sx={{ color: '#7b8a9a', mb: 2 }}>
                    Chưa có dữ liệu
                  </Typography>
                  <Button 
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ 
                      backgroundColor: '#00d4ff',
                      color: '#0f1419',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: '#00b8e6'
                      }
                    }}
                  >
                    THÊM GIAO DỊCH
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Customer Growth Chart */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              backgroundColor: '#1e2836',
              border: '1px solid #2a3644',
              borderRadius: 2,
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Tăng trưởng khách hàng
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip 
                    label="KH mới" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(0, 123, 255, 0.2)',
                      color: '#007bff',
                      border: '1px solid rgba(0, 123, 255, 0.4)'
                    }}
                  />
                  <Chip 
                    label="Tổng KH" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(40, 167, 69, 0.2)',
                      color: '#28a745',
                      border: '1px solid rgba(40, 167, 69, 0.4)'
                    }}
                  />
                </Stack>
                <Box sx={{ 
                  height: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px dashed #2a3644',
                  borderRadius: 2
                }}>
                  <Typography sx={{ color: '#7b8a9a' }}>
                    Chưa có dữ liệu
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Controls */}
        <Card sx={{ 
          mb: 4, 
          backgroundColor: '#1e2836',
          border: '1px solid #2a3644',
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm hợp đồng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#7b8a9a',
                      opacity: 1
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#7b8a9a' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#7b8a9a', '&.Mui-focused': { color: '#00d4ff' } }}>
                    Trạng thái
                  </InputLabel>
                  <Select
                    value={filterStatus}
                    label="Trạng thái"
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a3644'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#7b8a9a'
                      }
                    }}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {contractStatuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#7b8a9a', '&.Mui-focused': { color: '#00d4ff' } }}>
                    Loại hợp đồng
                  </InputLabel>
                  <Select
                    value={filterType}
                    label="Loại hợp đồng"
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a3644'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#7b8a9a'
                      }
                    }}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {contractTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      backgroundColor: '#00d4ff',
                      color: '#0f1419',
                      fontWeight: 'bold',
                      px: 3,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: '#00b8e6'
                      }
                    }}
                  >
                    Tạo hợp đồng mới
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleExportExcel}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderColor: '#00d4ff',
                      color: '#00d4ff',
                      '&:hover': {
                        borderColor: '#00b8e6',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)'
                      }
                    }}
                  >
                    Xuất Excel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Enhanced Contracts Table */}
        <Card sx={{ 
          backgroundColor: '#1e2836',
          border: '1px solid #2a3644',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid #2a3644'
          }}>
            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} sx={{ color: 'white' }}>
              <Assignment sx={{ color: '#00d4ff' }} />
              Danh sách hợp đồng ({filteredContracts.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#151d28' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Hợp đồng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Khách hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Giá trị</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Thời hạn</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Tiến độ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Ưu tiên</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#7b8a9a', borderBottom: '1px solid #2a3644' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, borderBottom: 'none' }}>
                      <Typography variant="body1" sx={{ color: '#7b8a9a' }}>
                        {loading ? 'Đang tải dữ liệu...' : 'Không có hợp đồng nào'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract, index) => (
                    <TableRow 
                      key={contract._id} 
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 212, 255, 0.05)'
                        },
                        borderBottom: '1px solid #2a3644'
                      }}
                    >
                      <TableCell sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: '#00d4ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {getTypeIcon(contract.type)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#00d4ff' }}>
                              {contract.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#7b8a9a' }} fontFamily="monospace">
                              {contract.contractNumber}
                            </Typography>
                            <Chip 
                              label={contract.type} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                mt: 0.5, 
                                fontSize: '0.7rem',
                                borderColor: '#2a3644',
                                color: '#7b8a9a'
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white' }}>
                            {contract.clientName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7b8a9a' }}>
                            {contract.clientEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#28a745' }}>
                          {formatCurrency(contract.value)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Box>
                          <Typography variant="body2" display="flex" alignItems="center" gap={1} sx={{ color: '#7b8a9a' }}>
                            <CalendarToday fontSize="small" />
                            {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#7b8a9a' }}>
                            {contract.signedDate ? `Đã ký: ${formatDate(contract.signedDate)}` : 'Chưa ký'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <LinearProgress
                              variant="determinate"
                              value={contract.progress || 0}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                flex: 1,
                                backgroundColor: '#2a3644',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  backgroundColor: (contract.progress || 0) === 100 ? '#28a745' : '#00d4ff'
                                }
                              }}
                            />
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#00d4ff' }}>
                              {contract.progress || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Chip
                          icon={getStatusIcon(contract.status)}
                          label={contract.status}
                          color={getStatusColor(contract.status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Chip
                          label={contract.priority}
                          color={getPriorityColor(contract.priority)}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #2a3644' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Xem hợp đồng">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: '#00d4ff',
                                '&:hover': { 
                                  backgroundColor: 'rgba(0, 212, 255, 0.1)'
                                }
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tải xuống">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: '#28a745',
                                '&:hover': { 
                                  backgroundColor: 'rgba(40, 167, 69, 0.1)'
                                }
                              }}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Gửi cho khách hàng">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: '#00d4ff',
                                '&:hover': { 
                                  backgroundColor: 'rgba(0, 212, 255, 0.1)'
                                }
                              }}
                            >
                              <Send />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(contract)}
                              sx={{ 
                                color: '#00d4ff',
                                '&:hover': { 
                                  backgroundColor: 'rgba(0, 212, 255, 0.1)'
                                }
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa hợp đồng">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteContract(contract._id)}
                              sx={{ 
                                color: '#dc3545',
                                '&:hover': { 
                                  backgroundColor: 'rgba(220, 53, 69, 0.1)'
                                }
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Enhanced Add/Edit Contract Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1e2836',
              borderRadius: 2,
              border: '1px solid #2a3644'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#151d28',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: '1px solid #2a3644'
          }}>
            <Assignment sx={{ color: '#00d4ff' }} />
            {editingContract ? 'Chỉnh sửa hợp đồng' : 'Tạo hợp đồng mới'}
          </DialogTitle>
          <DialogContent sx={{ p: 4, backgroundColor: '#1e2836' }}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tiêu đề hợp đồng"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#7b8a9a'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00d4ff'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#7b8a9a', '&.Mui-focused': { color: '#00d4ff' } }}>
                    Loại hợp đồng
                  </InputLabel>
                  <Select
                    value={contractForm.type}
                    label="Loại hợp đồng"
                    onChange={(e) => setContractForm({ ...contractForm, type: e.target.value })}
                    sx={{
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a3644'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#7b8a9a'
                      }
                    }}
                  >
                    {contractTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên khách hàng"
                  value={contractForm.clientName}
                  onChange={(e) => setContractForm({ ...contractForm, clientName: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#7b8a9a'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00d4ff'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email khách hàng"
                  type="email"
                  value={contractForm.clientEmail}
                  onChange={(e) => setContractForm({ ...contractForm, clientEmail: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#7b8a9a'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00d4ff'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Giá trị hợp đồng (VND)"
                  type="number"
                  value={contractForm.value}
                  onChange={(e) => setContractForm({ ...contractForm, value: parseFloat(e.target.value) || 0 })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#7b8a9a'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00d4ff'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ngày bắt đầu"
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#7b8a9a'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00d4ff'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ngày kết thúc"
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#7b8a9a'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00d4ff'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#7b8a9a', '&.Mui-focused': { color: '#00d4ff' } }}>
                    Mức độ ưu tiên
                  </InputLabel>
                  <Select
                    value={contractForm.priority}
                    label="Mức độ ưu tiên"
                    onChange={(e) => setContractForm({ ...contractForm, priority: e.target.value })}
                    sx={{
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a3644'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00d4ff'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#7b8a9a'
                      }
                    }}
                  >
                    {priorities.map(priority => (
                      <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả chi tiết"
                  multiline
                  rows={4}
                  value={contractForm.description}
                  onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0f1419',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#2a3644'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00d4ff'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#7b8a9a'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00d4ff'
                    },
                    '& .MuiInputBase-input': {
                      color: 'white'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2, backgroundColor: '#1e2836', borderTop: '1px solid #2a3644' }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                px: 3,
                color: '#7b8a9a',
                '&:hover': {
                  backgroundColor: 'rgba(123, 138, 154, 0.1)'
                }
              }}
            >
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleSaveContract} 
              variant="contained"
              sx={{
                px: 4,
                backgroundColor: '#00d4ff',
                color: '#0f1419',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#00b8e6'
                }
              }}
            >
              {editingContract ? 'Cập nhật' : 'Tạo mới'} hợp đồng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbars */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSuccess('')}
            severity="success"
            sx={{ 
              width: '100%',
              backgroundColor: '#28a745',
              color: 'white'
            }}
          >
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setError('')}
            severity="error"
            sx={{ 
              width: '100%',
              backgroundColor: '#dc3545',
              color: 'white'
            }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Contracts;