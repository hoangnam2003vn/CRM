import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Avatar,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Paper,
  Divider,
  Container,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Fade,
  Snackbar,
  Alert,
  createTheme,
  ThemeProvider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PersonAdd as PersonAddIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  ImportExport as ImportExportIcon,
  FileDownload as FileDownloadIcon,
  VisibilityOutlined as VisibilityIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';

// 🌊 Theme màu xanh nước biển - Dark Mode giống ảnh
const oceanBlueTheme = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryDark: '#0284C7',
  secondary: '#06B6D4',
  accent: '#00BCD4',
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBgLight: '#334155',
  hover: '#1E3A5F',
  border: '#334155',
  borderLight: '#475569',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  gradient: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
};

// Tạo MUI dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: oceanBlueTheme.primary,
    },
    background: {
      default: oceanBlueTheme.background,
      paper: oceanBlueTheme.cardBg,
    },
    text: {
      primary: oceanBlueTheme.textPrimary,
      secondary: oceanBlueTheme.textSecondary,
    }
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: oceanBlueTheme.border,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: oceanBlueTheme.border,
          },
        },
      },
    },
  },
});

const QuanLyKhachHang = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState('add');
  const [openForm, setOpenForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'Active',
    createdDate: new Date().toISOString().split('T')[0],
    phone: '',
    company: ''
  });

  const [isViewing, setIsViewing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (formMode === 'add') {
        const response = await fetch('http://localhost:5000/api/customers/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Thêm khách hàng thất bại');
        }
      } else if (formMode === 'edit') {
        const response = await fetch(`http://localhost:5000/api/customers/update/${selectedCustomer._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Cập nhật khách hàng thất bại');
        }
      }

      fetchCustomers();
      setOpenForm(false);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi thêm/sửa khách hàng:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      phone: '',
      company: ''
    });
    setFormMode('add');
    setSelectedCustomer(null);
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/customers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fetch customers thất bại');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi fetch danh sách khách hàng:', error);
      setCustomers([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = () => {
    setFormMode('add');
    resetForm();
    setOpenForm(true);
  };

  const handleEdit = (customer) => {
    setFormMode('edit');
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      status: customer.status,
      createdDate: customer.createdDate,
      phone: customer.phone,
      company: customer.company
    });
    setOpenForm(true);
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleViewCustomer = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          email: data.email,
          status: data.status,
          createdDate: data.createdDate,
          phone: data.phone,
          company: data.company,
        });
        setSelectedCustomer(data);
        setFormMode('view');
        setIsViewing(true);
        setOpenForm(true);
      } else {
        alert('Lỗi khi lấy dữ liệu khách hàng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu khách hàng:', error);
      alert('Không thể lấy dữ liệu khách hàng');
    }
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    setTableLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/customers/delete/${customerToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Xóa khách hàng thất bại');
      }

      await fetchCustomers();

      setSnackbar({
        open: true,
        message: 'Xóa khách hàng thành công!',
        severity: 'success'
      });

      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Lỗi khi xóa khách hàng:', error);

      setSnackbar({
        open: true,
        message: 'Xóa khách hàng thất bại!',
        severity: 'error'
      });
    } finally {
      setTableLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCustomers = () => {
    const csvContent = [
      ['STT', 'Tên khách hàng', 'Email', 'Số điện thoại', 'Công ty', 'Trạng thái', 'Ngày tạo'],
      ...filteredCustomers.map((customer, index) => [
        index + 1,
        customer.name,
        customer.email,
        customer.phone,
        customer.company,
        customer.status,
        customer.createdDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh-sach-khach-hang-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };

  const handleImportData = async () => {
    if (!importFile) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customers/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message,
          errors: result.errors || []
        });
        await fetchCustomers();
      } else {
        setImportResult({
          error: true,
          message: result.message || 'Nhập dữ liệu thất bại',
          errors: result.errors || []
        });
      }
    } catch (error) {
      console.error('Lỗi khi nhập dữ liệu:', error);
      setImportResult({
        error: true,
        message: 'Đã xảy ra lỗi khi nhập dữ liệu',
        errors: []
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      ['Tên khách hàng', 'Email', 'Số điện thoại', 'Trạng thái', 'Công ty'],
      ['Nguyễn Văn A', 'nguyenvana@example.com', '0901234567', 'Active', 'Công ty ABC'],
      ['Trần Thị B', 'tranthib@example.com', '0912345678', 'Inactive', 'Công ty XYZ']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau-danh-sach-khach-hang.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setTableLoading(true);
    fetchCustomers().finally(() => {
      setTableLoading(false);
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return oceanBlueTheme.secondary;
      case 'Inactive':
        return '#90A4AE';
      case 'Pending':
        return '#FFB74D';
      default:
        return '#90A4AE';
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: oceanBlueTheme.background,
        py: 4 
      }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                mb: 1,
                color: oceanBlueTheme.textPrimary,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Quản lý khách hàng
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: oceanBlueTheme.textSecondary }}
            >
              Danh sách và quản lý thông tin khách hàng
            </Typography>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  background: oceanBlueTheme.gradient,
                  color: 'white',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '120px',
                    height: '120px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    transform: 'translate(40px, -40px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Tổng khách hàng
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {customers.length}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <PersonAddIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  background: `linear-gradient(135deg, ${oceanBlueTheme.secondary} 0%, ${oceanBlueTheme.accent} 100%)`,
                  color: 'white',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '120px',
                    height: '120px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    transform: 'translate(40px, -40px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Đang hoạt động
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {customers.filter(c => c.status === 'Active').length}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  bgcolor: oceanBlueTheme.cardBg,
                  borderRadius: 3,
                  border: `1px solid ${oceanBlueTheme.border}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: oceanBlueTheme.primary,
                    boxShadow: `0 4px 20px ${oceanBlueTheme.primary}30`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: oceanBlueTheme.textSecondary, mb: 1 }}>
                        Không hoạt động
                      </Typography>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: oceanBlueTheme.textPrimary }}>
                        {customers.filter(c => c.status === 'Inactive').length}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: oceanBlueTheme.cardBgLight, color: oceanBlueTheme.primary, width: 56, height: 56 }}>
                      <BusinessIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{ 
                  bgcolor: oceanBlueTheme.cardBg,
                  borderRadius: 3,
                  border: `1px solid ${oceanBlueTheme.border}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: oceanBlueTheme.primary,
                    boxShadow: `0 4px 20px ${oceanBlueTheme.primary}30`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: oceanBlueTheme.textSecondary, mb: 1 }}>
                        Chờ xử lý
                      </Typography>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: oceanBlueTheme.textPrimary }}>
                        {customers.filter(c => c.status === 'Pending').length}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: oceanBlueTheme.cardBgLight, color: oceanBlueTheme.primary, width: 56, height: 56 }}>
                      <CalendarIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Search and Actions */}
          <Card 
            elevation={0}
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              bgcolor: oceanBlueTheme.cardBg,
              border: `1px solid ${oceanBlueTheme.border}`
            }}
          >
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: oceanBlueTheme.primary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      label="Trạng thái"
                      startAdornment={
                        <InputAdornment position="start">
                          <FilterListIcon sx={{ color: oceanBlueTheme.primary, ml: 1 }} />
                        </InputAdornment>
                      }
                      sx={{
                        borderRadius: '12px',
                      }}
                    >
                      <MenuItem value="All">Tất cả</MenuItem>
                      <MenuItem value="Active">Đang hoạt động</MenuItem>
                      <MenuItem value="Inactive">Không hoạt động</MenuItem>
                      <MenuItem value="Pending">Chờ xử lý</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddCustomer}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        px: 3,
                        background: oceanBlueTheme.gradient,
                        boxShadow: `0 4px 14px ${oceanBlueTheme.primary}40`,
                        '&:hover': {
                          boxShadow: `0 6px 20px ${oceanBlueTheme.primary}60`,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Thêm mới
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<ImportExportIcon />}
                      onClick={handleOpenImportDialog}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        borderColor: oceanBlueTheme.primary,
                        color: oceanBlueTheme.primary,
                        '&:hover': {
                          borderColor: oceanBlueTheme.primaryDark,
                          bgcolor: oceanBlueTheme.hover,
                        }
                      }}
                    >
                      Nhập
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportCustomers}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        borderColor: oceanBlueTheme.primary,
                        color: oceanBlueTheme.primary,
                        '&:hover': {
                          borderColor: oceanBlueTheme.primaryDark,
                          bgcolor: oceanBlueTheme.hover,
                        }
                      }}
                    >
                      Xuất
                    </Button>

                    <IconButton
                      onClick={handleRefresh}
                      sx={{
                        bgcolor: oceanBlueTheme.hover,
                        color: oceanBlueTheme.primary,
                        '&:hover': {
                          bgcolor: oceanBlueTheme.primary,
                          color: 'white',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer Table */}
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: oceanBlueTheme.cardBg,
              border: `1px solid ${oceanBlueTheme.border}`
            }}
          >
            {tableLoading && <LinearProgress sx={{ bgcolor: oceanBlueTheme.hover, '& .MuiLinearProgress-bar': { bgcolor: oceanBlueTheme.primary } }} />}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: oceanBlueTheme.cardBgLight }}>
                    <TableCell sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>Số điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>Công ty</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>Ngày tạo</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: oceanBlueTheme.textPrimary }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <CircularProgress sx={{ color: oceanBlueTheme.primary }} />
                        <Typography variant="body2" sx={{ mt: 2, color: oceanBlueTheme.primary }}>
                          Đang tải dữ liệu...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" sx={{ color: oceanBlueTheme.textSecondary }}>
                          Không tìm thấy khách hàng nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer, index) => (
                      <TableRow 
                        key={customer._id}
                        sx={{
                          '&:hover': {
                            bgcolor: oceanBlueTheme.hover,
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <TableCell sx={{ color: oceanBlueTheme.textPrimary }}>{index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: oceanBlueTheme.primary,
                                width: 40,
                                height: 40,
                                fontSize: '0.9rem'
                              }}
                            >
                              {customer.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography fontWeight="medium" sx={{ color: oceanBlueTheme.textPrimary }}>
                              {customer.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MailIcon sx={{ fontSize: 18, color: oceanBlueTheme.primary }} />
                            <Typography sx={{ color: oceanBlueTheme.textPrimary }}>{customer.email}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 18, color: oceanBlueTheme.primary }} />
                            <Typography sx={{ color: oceanBlueTheme.textPrimary }}>{customer.phone}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon sx={{ fontSize: 18, color: oceanBlueTheme.primary }} />
                            <Typography sx={{ color: oceanBlueTheme.textPrimary }}>{customer.company}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.status === 'Active' ? 'Hoạt động' : customer.status === 'Inactive' ? 'Ngừng' : 'Chờ'}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(customer.status),
                              color: 'white',
                              fontWeight: 'medium',
                              borderRadius: '8px'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 18, color: oceanBlueTheme.primary }} />
                            <Typography sx={{ color: oceanBlueTheme.textPrimary }}>{customer.createdDate}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                size="small"
                                onClick={() => handleViewCustomer(customer._id)}
                                sx={{
                                  color: oceanBlueTheme.primary,
                                  '&:hover': {
                                    bgcolor: oceanBlueTheme.hover,
                                  }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(customer)}
                                sx={{
                                  color: oceanBlueTheme.secondary,
                                  '&:hover': {
                                    bgcolor: oceanBlueTheme.hover,
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(customer)}
                                sx={{
                                  color: '#EF5350',
                                  '&:hover': {
                                    bgcolor: '#FFEBEE',
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Container>

        {/* Form Dialog */}
        <Dialog
          open={openForm}
          onClose={() => {
            setOpenForm(false);
            setIsViewing(false);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            elevation: 24,
            sx: { 
              borderRadius: 3,
              bgcolor: oceanBlueTheme.cardBg,
              border: `1px solid ${oceanBlueTheme.border}`
            }
          }}
        >
          <DialogTitle
            sx={{
              background: oceanBlueTheme.gradient,
              color: 'white',
              px: 3,
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              {formMode === 'view' ? <VisibilityIcon /> : formMode === 'add' ? <AddIcon /> : <EditIcon />}
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {formMode === 'view' ? 'Chi tiết khách hàng' : formMode === 'add' ? 'Thêm khách hàng mới' : 'Chỉnh sửa thông tin khách hàng'}
            </Typography>
          </DialogTitle>

          <form id="customer-form" onSubmit={handleSubmit}>
            <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tên khách hàng"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isViewing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isViewing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isViewing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Công ty"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    disabled={isViewing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="Trạng thái"
                      disabled={isViewing}
                      sx={{
                        borderRadius: '12px',
                      }}
                    >
                      <MenuItem value="Active">Đang hoạt động</MenuItem>
                      <MenuItem value="Inactive">Không hoạt động</MenuItem>
                      <MenuItem value="Pending">Chờ xử lý</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ngày tạo"
                    name="createdDate"
                    type="date"
                    value={formData.createdDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    disabled={isViewing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <Divider sx={{ borderColor: oceanBlueTheme.border }} />

            <DialogActions sx={{ px: 3, py: 2, bgcolor: oceanBlueTheme.cardBgLight }}>
              <Button
                onClick={() => {
                  setOpenForm(false);
                  setIsViewing(false);
                }}
                variant="outlined"
                sx={{ 
                  borderRadius: '10px',
                  borderColor: oceanBlueTheme.primary,
                  color: oceanBlueTheme.primary,
                  '&:hover': {
                    borderColor: oceanBlueTheme.primaryDark,
                    bgcolor: oceanBlueTheme.hover,
                  }
                }}
              >
                {isViewing ? 'Đóng' : 'Hủy'}
              </Button>

              {isViewing && (
                <Button
                  onClick={() => {
                    setFormMode('edit');
                    setIsViewing(false);
                  }}
                  variant="contained"
                  sx={{
                    borderRadius: '10px',
                    ml: 1,
                    background: oceanBlueTheme.gradient,
                    '&:hover': {
                      boxShadow: `0 4px 14px ${oceanBlueTheme.primary}40`,
                    }
                  }}
                >
                  Chỉnh sửa
                </Button>
              )}

              {!isViewing && (
                <Button
                  type="submit"
                  variant="contained"
                  form="customer-form"
                  disabled={isLoading}
                  sx={{
                    borderRadius: '10px',
                    ml: 1,
                    position: 'relative',
                    background: oceanBlueTheme.gradient,
                    '&:hover': {
                      boxShadow: `0 4px 14px ${oceanBlueTheme.primary}40`,
                    }
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    formMode === 'add' ? 'Thêm khách hàng' : 'Lưu thay đổi'
                  )}
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            elevation: 24,
            sx: { 
              borderRadius: 3,
              bgcolor: oceanBlueTheme.cardBg,
              border: `1px solid ${oceanBlueTheme.border}`
            }
          }}
        >
          <DialogTitle sx={{ color: oceanBlueTheme.textPrimary }}>
            <Typography variant="h6" fontWeight="bold">Xác nhận xóa</Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: oceanBlueTheme.textSecondary }}>
              Bạn có chắc chắn muốn xóa khách hàng <b style={{ color: oceanBlueTheme.textPrimary }}>{customerToDelete?.name}</b>? Hành động này không thể hoàn tác.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              variant="outlined"
              sx={{ 
                borderRadius: '10px',
                borderColor: oceanBlueTheme.primary,
                color: oceanBlueTheme.primary,
                '&:hover': {
                  borderColor: oceanBlueTheme.primaryDark,
                  bgcolor: oceanBlueTheme.hover,
                }
              }}
              disabled={tableLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={tableLoading}
              sx={{
                borderRadius: '10px',
                ml: 1,
                position: 'relative'
              }}
            >
              {tableLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Xóa khách hàng'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading Indicator */}
        <Fade in={tableLoading}>
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 2000,
              bgcolor: oceanBlueTheme.cardBg,
              borderRadius: 2,
              boxShadow: `0 4px 20px ${oceanBlueTheme.primary}30`,
              border: `1px solid ${oceanBlueTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1.5,
            }}
          >
            <CircularProgress size={20} sx={{ mr: 2, color: oceanBlueTheme.primary }} />
            <Typography variant="body2" sx={{ color: oceanBlueTheme.textPrimary }}>Đang xử lý...</Typography>
          </Box>
        </Fade>

        {/* Import Dialog */}
        <Dialog
          open={importDialogOpen}
          onClose={handleImportDialogClose}
          maxWidth="md"
          PaperProps={{
            elevation: 24,
            sx: { 
              borderRadius: 3,
              bgcolor: oceanBlueTheme.cardBg,
              border: `1px solid ${oceanBlueTheme.border}`
            }
          }}
        >
          <DialogTitle sx={{
            borderBottom: `1px solid ${oceanBlueTheme.border}`,
            px: 3,
            py: 2,
            background: oceanBlueTheme.gradient,
            color: 'white'
          }}>
            <Typography variant="h6" fontWeight="bold">
              Nhập dữ liệu khách hàng
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            {!importResult ? (
              <Box>
                <Typography variant="body1" gutterBottom sx={{ color: oceanBlueTheme.textPrimary }}>
                  Chọn file Excel (.xlsx, .xls) hoặc CSV (.csv) chứa dữ liệu khách hàng để nhập vào hệ thống.
                </Typography>
                <Typography variant="body2" sx={{ color: oceanBlueTheme.textSecondary, mb: 2 }}>
                  File phải có các cột sau: Tên khách hàng, Email, Số điện thoại, Trạng thái, Công ty.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadTemplate}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    borderColor: oceanBlueTheme.primary,
                    color: oceanBlueTheme.primary,
                    '&:hover': {
                      borderColor: oceanBlueTheme.primaryDark,
                      bgcolor: oceanBlueTheme.hover,
                    }
                  }}
                >
                  Tải file mẫu
                </Button>

                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  id="import-file-input"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    htmlFor="import-file-input"
                    startIcon={<ImportExportIcon />}
                    sx={{ 
                      borderRadius: 2,
                      borderColor: oceanBlueTheme.primary,
                      color: oceanBlueTheme.primary,
                      '&:hover': {
                        borderColor: oceanBlueTheme.primaryDark,
                        bgcolor: oceanBlueTheme.hover,
                      }
                    }}
                  >
                    Chọn file
                  </Button>
                  <Typography variant="body2" sx={{ color: oceanBlueTheme.textSecondary }}>
                    {importFile ? importFile.name : 'Chưa chọn file nào'}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box>
                {importResult.error ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                    <Typography variant="body1" color="error" gutterBottom>
                      {importResult.message}
                    </Typography>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto', width: '100%', bgcolor: oceanBlueTheme.cardBgLight, p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom sx={{ color: oceanBlueTheme.textPrimary }}>
                          Lỗi chi tiết:
                        </Typography>
                        {importResult.errors.map((error, index) => (
                          <Typography key={index} variant="body2" color="error" sx={{ mb: 0.5 }}>
                            - {error}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 48, color: oceanBlueTheme.secondary, mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ color: oceanBlueTheme.textPrimary }}>
                      Nhập dữ liệu thành công!
                    </Typography>
                    <Typography variant="body1" sx={{ color: oceanBlueTheme.textSecondary }}>
                      {importResult.message}
                    </Typography>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto', width: '100%', bgcolor: oceanBlueTheme.cardBgLight, p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom sx={{ color: oceanBlueTheme.textPrimary }}>
                          Cảnh báo:
                        </Typography>
                        {importResult.errors.map((error, index) => (
                          <Typography key={index} variant="body2" color="warning.main" sx={{ mb: 0.5 }}>
                            - {error}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${oceanBlueTheme.border}`, bgcolor: oceanBlueTheme.cardBgLight }}>
            <Button
              onClick={handleImportDialogClose}
              variant="outlined"
              sx={{ 
                borderRadius: '10px',
                borderColor: oceanBlueTheme.primary,
                color: oceanBlueTheme.primary,
                '&:hover': {
                  borderColor: oceanBlueTheme.primaryDark,
                  bgcolor: oceanBlueTheme.hover,
                }
              }}
            >
              {importResult ? 'Đóng' : 'Hủy'}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImportData}
                variant="contained"
                disabled={!importFile || importLoading}
                sx={{
                  borderRadius: '10px',
                  ml: 1,
                  position: 'relative',
                  background: oceanBlueTheme.gradient,
                  '&:hover': {
                    boxShadow: `0 4px 14px ${oceanBlueTheme.primary}40`,
                  }
                }}
              >
                {importLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Nhập dữ liệu'
                )}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: '8px',
              boxShadow: `0 4px 12px ${oceanBlueTheme.primary}30`,
              bgcolor: snackbar.severity === 'success' ? oceanBlueTheme.secondary : undefined
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default QuanLyKhachHang;