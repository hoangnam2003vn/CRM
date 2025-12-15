import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  InputAdornment,
  Collapse,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  CancelOutlined as CancelIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

const Transactions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

  const isFirstRender = useRef(true);

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';

    try {
      // Nếu là dạng ISO hoặc YYYY-MM-DD
      if (dateString.includes('-') || dateString.includes('T')) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }

      // Nếu đã ở dạng DD/MM/YYYY thì giữ nguyên
      if (dateString.includes('/') && dateString.split('/').length === 3) {
        return dateString;
      }
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
    }

    return dateString;
  };

  const parseDateDDMMYYYY = (dateString) => {
    if (!dateString) return '';

    try {
      // Nếu đã ở dạng YYYY-MM-DD thì giữ nguyên
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        return dateString;
      }

      // Chuyển từ DD/MM/YYYY sang YYYY-MM-DD
      if (dateString.includes('/') && dateString.split('/').length === 3) {
        const parts = dateString.split('/');
        // Đảm bảo đúng thứ tự DD/MM/YYYY -> YYYY-MM-DD
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } catch (error) {
      console.error('Lỗi chuyển đổi ngày:', error);
    }

    return dateString;
  };

  // Kiểm tra định dạng DD/MM/YYYY
  const isValidDateFormat = (dateString) => {
    if (!dateString) return true; // Chuỗi rỗng là hợp lệ

    // Kiểm tra định dạng DD/MM/YYYY
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateString)) return false;

    // Kiểm tra tính hợp lệ của ngày tháng
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Kiểm tra tháng hợp lệ (1-12)
    if (month < 1 || month > 12) return false;

    // Kiểm tra ngày hợp lệ theo tháng
    const daysInMonth = new Date(year, month, 0).getDate();
    return day > 0 && day <= daysInMonth;
  };

  const formatDateInput = (value) => {
    // Xóa tất cả các ký tự không phải số
    const numbers = value.replace(/[^\d]/g, '');

    // Tự động thêm dấu "/"
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // State
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]); // Thêm state cho danh sách sản phẩm
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [formData, setFormData] = useState({
    customer: '',
    product: '', // Thêm trường sản phẩm
    amount: '',
    type: 'Thu',
    date: new Date().toISOString().split('T')[0],
    dateDisplay: formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]),
    status: 'Đang xử lý',
    paymentMethod: 'Tiền mặt',
    description: ''
  });
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    pendingAmount: 0,
    completedAmount: 0,
  });

  // Fetch products from API
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Đang tải danh sách sản phẩm...');

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status products:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response products:', errorText);
        throw new Error(`API trả về lỗi ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dữ liệu sản phẩm nhận được:', data);
      setProducts(data);
    } catch (error) {
      console.error('Lỗi fetch products:', error);
      showSnackbar('Không thể tải danh sách sản phẩm: ' + error.message, 'error');
      // Nếu không tải được sản phẩm, set danh sách rỗng
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token đang dùng:', token ? 'Có token' : 'Không có token');

      // Build URL có query params
      const queryParams = new URLSearchParams();
      if (searchText) queryParams.append('searchText', searchText);
      if (statusFilter && statusFilter !== 'all') queryParams.append('statusFilter', statusFilter);
      if (dateFilter.startDate && dateFilter.endDate) {
        queryParams.append('startDate', parseDateDDMMYYYY(dateFilter.startDate));
        queryParams.append('endDate', parseDateDDMMYYYY(dateFilter.endDate));
      }

      const apiUrl = `http://localhost:5000/api/transactions?${queryParams.toString()}`;
      console.log('Đang gọi API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`API trả về lỗi ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dữ liệu nhận được:', data);

      setTransactions(data);

      // Cập nhật thống kê
      if (Array.isArray(data)) {
        const totalTransactions = data.length;
        let totalAmount = 0;
        let pendingAmount = 0;
        let completedAmount = 0;

        data.forEach(transaction => {
          const amount = parseFloat(transaction.amount) || 0;
          totalAmount += amount;

          if (transaction.status === 'Đang xử lý') {
            pendingAmount += amount;
          } else if (transaction.status === 'Đã hoàn thành') {
            completedAmount += amount;
          }
        });

        setStatistics({
          totalTransactions,
          totalAmount,
          pendingAmount,
          completedAmount
        });
      }
    } catch (error) {
      console.error('Lỗi fetch transactions:', error);
      showSnackbar('Không thể tải dữ liệu giao dịch: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Thêm useEffect này ngay sau khai báo hàm fetchTransactions
  useEffect(() => {
    console.log('Component Transactions đã mount, đang tải dữ liệu...');
    fetchTransactions();
    fetchProducts(); // Tải danh sách sản phẩm khi component mount
  }, []); // Mảng dependencies rỗng sẽ chỉ chạy useEffect này một lần khi component mount

  useEffect(() => {
    // Sử dụng debounce để tránh gọi API quá nhiều khi người dùng gõ
    const timer = setTimeout(() => {
      console.log('Tìm kiếm với từ khóa:', searchText);
      fetchTransactions();
    }, 500); // Chờ 500ms sau khi người dùng ngừng gõ

    return () => clearTimeout(timer);
  }, [searchText]);

  // Sửa useEffect theo dõi bộ lọc trạng thái
  useEffect(() => {
    // Tránh gọi API lần đầu tiên khi component mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    console.log('Lọc theo trạng thái:', statusFilter);
    fetchTransactions();
  }, [statusFilter]);

  // THÊM MỚI - useEffect theo dõi bộ lọc ngày
  useEffect(() => {
    // Chỉ gọi khi cả startDate và endDate được điền đầy đủ và có định dạng hợp lệ
    if (dateFilter.startDate && dateFilter.endDate) {
      if (isValidDateFormat(dateFilter.startDate) && isValidDateFormat(dateFilter.endDate)) {
        console.log('Lọc theo ngày:', dateFilter);
        fetchTransactions();
      }
    }
  }, [dateFilter.startDate, dateFilter.endDate]);

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Xử lý thay đổi dữ liệu biểu mẫu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Xử lý thay đổi bộ lọc ngày
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter({
      ...dateFilter,
      [name]: value
    });
  };

  // Hiển thị thông báo snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Xử lý đóng snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Xử lý chỉnh sửa giao dịch
  const handleEdit = (transaction) => {
    console.log('Dữ liệu giao dịch cần sửa:', transaction);

    setCurrentTransaction(transaction);

    // Map dữ liệu từ API sang form
    setFormData({
      customer: transaction.customer,
      product: transaction.product || '', // Thêm trường sản phẩm
      amount: transaction.amount,
      // Chuyển đổi từ 'thu'/'chi' (backend) sang 'Thu'/'Chi' (frontend)
      type: transaction.transactionType === 'thu' ? 'Thu' : 'Chi',
      date: transaction.date || transaction.transactionDate,
      // Thêm dateDisplay với định dạng DD/MM/YYYY
      dateDisplay: formatDateToDDMMYYYY(transaction.date || transaction.transactionDate),
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description || ''
    });

    setOpenDialog(true);
  };

  // Xử lý thêm giao dịch mới
  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0];

    setCurrentTransaction(null);
    setFormData({
      customer: '',
      product: '', // Thêm trường sản phẩm
      amount: '',
      type: 'Thu',
      date: today,
      dateDisplay: formatDateToDDMMYYYY(today),
      status: 'Đang xử lý',
      paymentMethod: 'Tiền mặt',
      description: ''
    });
    setOpenDialog(true);
  };

  // Xử lý xóa giao dịch
  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        console.log('Đang xóa giao dịch:', transactionToDelete._id);

        const response = await fetch(`http://localhost:5000/api/transactions/delete/${transactionToDelete._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status xóa:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Lỗi khi xóa:', errorText);
          throw new Error(`Không thể xóa giao dịch: ${response.status}`);
        }

        const data = await response.json();
        console.log('Kết quả xóa:', data);

        showSnackbar('Xóa giao dịch thành công');
        fetchTransactions(); // Tải lại dữ liệu sau khi xóa
      } catch (error) {
        console.error('Lỗi khi xóa giao dịch:', error);
        showSnackbar('Không thể xóa giao dịch: ' + error.message, 'error');
      } finally {
        setLoading(false);
        setConfirmDeleteOpen(false);
        setTransactionToDelete(null);
      }
    }
  };


  // Xử lý lưu giao dịch
  const handleSave = async () => {
    if (!formData.customer || !formData.amount || !formData.dateDisplay) {
      showSnackbar('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    if (!isValidDateFormat(formData.dateDisplay)) {
      showSnackbar('Ngày giao dịch không đúng định dạng DD/MM/YYYY', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Map các giá trị để khớp với schema backend
      const formattedData = {
        customer: formData.customer,
        product: formData.product || '', // Thêm trường sản phẩm
        amount: parseFloat(formData.amount),
        transactionType: formData.type === 'Thu' ? 'thu' : 'chi',
        description: formData.description || "",
        // Chuyển đổi từ định dạng DD/MM/YYYY sang YYYY-MM-DD cho backend
        transactionDate: parseDateDDMMYYYY(formData.dateDisplay),
        paymentMethod: formData.paymentMethod,
        status: formData.status
      };

      console.log('Dữ liệu gửi lên:', formattedData);

      // Phần còn lại của hàm không thay đổi...

      if (currentTransaction) {
        const response = await fetch(`http://localhost:5000/api/transactions/update/${currentTransaction._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formattedData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Lỗi response:', errorText);
          throw new Error(`Cập nhật thất bại: ${response.status}`);
        }

        const data = await response.json();
        showSnackbar('Cập nhật giao dịch thành công');
        fetchTransactions();

      } else {
        const response = await fetch('http://localhost:5000/api/transactions/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formattedData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Lỗi response:', errorText);
          throw new Error(`Thêm thất bại: ${response.status}`);
        }

        const data = await response.json();
        showSnackbar('Thêm giao dịch thành công');
        fetchTransactions();
      }

      setOpenDialog(false);
    } catch (error) {
      console.error('Lỗi khi lưu giao dịch:', error);
      showSnackbar('Không thể lưu giao dịch: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xuất dữ liệu
  const handleExport = async () => {
    try {
      setLoading(true); // Bắt đầu hiển thị loading
      showSnackbar('Đang chuẩn bị xuất dữ liệu...', 'info');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      console.log('Đang gọi API xuất Excel...');

      // Gọi API endpoint xuất Excel
      const response = await fetch('http://localhost:5000/api/transactions/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Không thể xuất dữ liệu (${response.status}: ${response.statusText})`);
      }

      // Kiểm tra content-type để đảm bảo nhận được file Excel
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!contentType || !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        console.warn('Unexpected content type:', contentType);
        // Vẫn tiếp tục, có thể server không trả về đúng content-type
      }

      // Lấy blob từ response
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('Nhận được file rỗng từ server');
      }

      // Tạo URL cho blob
      const url = window.URL.createObjectURL(blob);

      // Tạo link và click để tải xuống
      const a = document.createElement('a');
      a.href = url;
      a.download = 'danh-sach-giao-dich.xlsx';
      document.body.appendChild(a);
      a.click();

      // Dọn dẹp
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      // Hiển thị thông báo thành công
      showSnackbar('Xuất dữ liệu thành công');
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu:', error);
      showSnackbar('Không thể xuất dữ liệu: ' + error.message, 'error');
    } finally {
      setLoading(false); // Kết thúc hiển thị loading
    }
  };

  // Xử lý thay đổi trang
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Xử lý thay đổi số hàng mỗi trang
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Màu sắc trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã hoàn thành':
        return 'success';
      case 'Đang xử lý':
        return 'primary';
      case 'Hủy':
        return 'error';
      default:
        return 'default';
    }
  };

  // Lấy biểu tượng trạng thái
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Đã hoàn thành':
        return <CheckCircleIcon fontSize="small" />;
      case 'Đang xử lý':
        return <PendingIcon fontSize="small" />;
      case 'Hủy':
        return <CancelIcon fontSize="small" />;
      default:
        return null;
    }
  };

  // Lấy màu loại giao dịch
  const getTypeColor = (type) => {
    return type === 'Thu' ? '#4caf50' : '#f44336';
  };

  return (
    <Box sx={{
      padding: { xs: '16px', md: '24px' },
      backgroundColor: '#0d1b2a',
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100%',
      margin: 0,
      overflowX: 'hidden'
    }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          borderRadius: '12px',
          backgroundColor: '#1a2332',
          color: '#00bcd4',
          border: '1px solid rgba(0, 188, 212, 0.2)'
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          Quản lý giao dịch
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Quản lý tất cả các giao dịch thu chi của doanh nghiệp
        </Typography>
      </Paper>

      {/* Thẻ thống kê */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '12px',
              height: '100%',
              backgroundColor: '#1a2332',
              border: '1px solid rgba(0, 188, 212, 0.2)',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0, 188, 212, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(0, 188, 212, 0.2)',
                    color: '#00bcd4',
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <AccountBalanceIcon />
                </Avatar>
                <Typography color="rgba(255, 255, 255, 0.7)" variant="subtitle2">
                  Tổng số giao dịch
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                {statistics.totalTransactions}
              </Typography>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                Tất cả giao dịch trong hệ thống
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '12px',
              height: '100%',
              backgroundColor: '#1a2332',
              border: '1px solid rgba(0, 188, 212, 0.2)',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0, 188, 212, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(0, 188, 212, 0.2)',
                    color: '#00bcd4',
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <MonetizationOnIcon />
                </Avatar>
                <Typography color="rgba(255, 255, 255, 0.7)" variant="subtitle2">
                  Tổng giá trị
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                {formatCurrency(statistics.totalAmount)}
              </Typography>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                Tổng giá trị giao dịch
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '12px',
              height: '100%',
              backgroundColor: '#1a2332',
              border: '1px solid rgba(0, 188, 212, 0.2)',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0, 188, 212, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 193, 7, 0.2)',
                    color: '#ffc107',
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <PendingIcon />
                </Avatar>
                <Typography color="rgba(255, 255, 255, 0.7)" variant="subtitle2">
                  Đang xử lý
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffc107' }}>
                {formatCurrency(statistics.pendingAmount)}
              </Typography>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                Tổng giá trị giao dịch đang xử lý
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '12px',
              height: '100%',
              backgroundColor: '#1a2332',
              border: '1px solid rgba(0, 188, 212, 0.2)',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0, 188, 212, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                    color: '#4caf50',
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <CheckCircleIcon />
                </Avatar>
                <Typography color="rgba(255, 255, 255, 0.7)" variant="subtitle2">
                  Đã hoàn thành
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {formatCurrency(statistics.completedAmount)}
              </Typography>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                Tổng giá trị giao dịch đã hoàn thành
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Thanh công cụ */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          borderRadius: '12px',
          backgroundColor: '#1a2332',
          border: '1px solid rgba(0, 188, 212, 0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center'
        }}
      >
        <TextField
          label="Tìm kiếm"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => {
            const value = e.target.value;
            console.log('Giá trị nhập vào ô tìm kiếm:', value);
            setSearchText(value);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#00bcd4' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: '#0d1b2a',
              color: 'white',
              '& fieldset': {
                borderColor: 'rgba(0, 188, 212, 0.3)'
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 188, 212, 0.5)'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00bcd4'
              }
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }}
          placeholder="Tìm theo tên khách hàng, sản phẩm hoặc mô tả"
        />

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterVisible(!filterVisible)}
            sx={{
              borderRadius: '8px',
              borderColor: 'rgba(0, 188, 212, 0.5)',
              color: '#00bcd4',
              '&:hover': {
                borderColor: '#00bcd4',
                backgroundColor: 'rgba(0, 188, 212, 0.1)'
              }
            }}
          >
            Bộ lọc
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{
              borderRadius: '8px',
              bgcolor: '#00bcd4',
              color: '#0d1b2a',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#00acc1'
              },
              boxShadow: 'none'
            }}
          >
            Thêm giao dịch
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            sx={{
              borderRadius: '8px',
              borderColor: 'rgba(0, 188, 212, 0.5)',
              color: '#00bcd4',
              '&:hover': {
                borderColor: '#00bcd4',
                backgroundColor: 'rgba(0, 188, 212, 0.1)'
              }
            }}
          >
            Xuất Excel
          </Button>

          <IconButton
            onClick={fetchTransactions}
            sx={{
              borderRadius: '8px',
              border: '1px solid rgba(0, 188, 212, 0.5)',
              color: '#00bcd4',
              '&:hover': {
                backgroundColor: 'rgba(0, 188, 212, 0.1)',
                borderColor: '#00bcd4'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Bộ lọc */}
      <Collapse in={filterVisible}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 3,
            borderRadius: '12px',
            backgroundColor: '#1a2332',
            border: '1px solid rgba(0, 188, 212, 0.2)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Từ ngày"
                    name="startDate"
                    value={dateFilter.startDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      const formattedValue = formatDateInput(value);
                      setDateFilter({
                        ...dateFilter,
                        startDate: formattedValue
                      });
                    }}
                    placeholder="DD/MM/YYYY"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ maxLength: 10 }}
                    helperText="Định dạng: DD/MM/YYYY"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#0d1b2a',
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(0, 188, 212, 0.3)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 188, 212, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00bcd4'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)'
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Đến ngày"
                    name="endDate"
                    value={dateFilter.endDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      const formattedValue = formatDateInput(value);
                      setDateFilter({
                        ...dateFilter,
                        endDate: formattedValue
                      });
                    }}
                    placeholder="DD/MM/YYYY"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ maxLength: 10 }}
                    helperText="Định dạng: DD/MM/YYYY"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#0d1b2a',
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(0, 188, 212, 0.3)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 188, 212, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00bcd4'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)'
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#00bcd4'
                  }
                }}
              >
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      color: 'white'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a2332',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            bgcolor: 'rgba(0, 188, 212, 0.1)'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 188, 212, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 188, 212, 0.3)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="all">Tất cả trạng thái</MenuItem>
                  <MenuItem value="Đã hoàn thành">Đã hoàn thành</MenuItem>
                  <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
                  <MenuItem value="Hủy">Hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={() => {
                  console.log('Đang xóa bộ lọc...');

                  // Đặt lại các bộ lọc về giá trị mặc định
                  setDateFilter({
                    startDate: '',
                    endDate: ''
                  });
                  setStatusFilter('all');
                  setSearchText('');

                  // Gọi lại fetchTransactions một cách trực tiếp với các tham số trống
                  const resetAndFetch = async () => {
                    try {
                      const token = localStorage.getItem('token');
                      console.log('Tải lại dữ liệu sau khi xóa bộ lọc');

                      // Gọi API không có tham số
                      const apiUrl = `http://localhost:5000/api/transactions`;
                      console.log('Đang gọi API sau khi xóa bộ lọc:', apiUrl);

                      const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        }
                      });

                      if (!response.ok) {
                        throw new Error(`API trả về lỗi ${response.status}`);
                      }

                      const data = await response.json();
                      console.log('Dữ liệu nhận được sau khi xóa bộ lọc:', data);

                      setTransactions(data);

                      // Cập nhật thống kê
                      if (Array.isArray(data)) {
                        const totalTransactions = data.length;
                        let totalAmount = 0;
                        let pendingAmount = 0;
                        let completedAmount = 0;

                        data.forEach(transaction => {
                          const amount = parseFloat(transaction.amount) || 0;
                          totalAmount += amount;

                          if (transaction.status === 'Đang xử lý') {
                            pendingAmount += amount;
                          } else if (transaction.status === 'Đã hoàn thành') {
                            completedAmount += amount;
                          }
                        });

                        setStatistics({
                          totalTransactions,
                          totalAmount,
                          pendingAmount,
                          completedAmount
                        });
                      }
                    } catch (error) {
                      console.error('Lỗi khi tải lại dữ liệu:', error);
                      showSnackbar('Không thể tải lại dữ liệu: ' + error.message, 'error');
                    }
                  };

                  // Thực hiện việc đặt lại và tải lại dữ liệu
                  setLoading(true);
                  resetAndFetch().finally(() => setLoading(false));
                }}
                sx={{
                  borderRadius: '8px',
                  borderColor: 'rgba(0, 188, 212, 0.5)',
                  color: '#00bcd4',
                  '&:hover': {
                    borderColor: '#00bcd4',
                    backgroundColor: 'rgba(0, 188, 212, 0.1)'
                  }
                }}
                fullWidth={isMobile}
                startIcon={<CloseIcon />}
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Bảng giao dịch */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#1a2332',
          border: '1px solid rgba(0, 188, 212, 0.2)'
        }}
      >
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            Danh sách giao dịch
          </Typography>
          {loading && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} sx={{ color: '#00bcd4' }} />
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                Đang tải...
              </Typography>
            </Box>
          )}
        </Box>
        <Divider sx={{ borderColor: 'rgba(0, 188, 212, 0.2)' }} />
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#0d1b2a' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Số tiền</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Phương thức</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#00bcd4' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, borderBottom: 'none' }}>
                    <CircularProgress size={40} sx={{ mb: 2, color: '#00bcd4' }} />
                    <Typography variant="body1" display="block" color="rgba(255, 255, 255, 0.7)">
                      Đang tải dữ liệu...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : transactions.length > 0 ? (
                transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction) => (
                  <TableRow
                    key={transaction._id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(0, 188, 212, 0.05)'
                      },
                      transition: 'background-color 0.2s',
                      borderBottom: '1px solid rgba(0, 188, 212, 0.1)'
                    }}
                  >
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{transaction._id}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{transaction.customer}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ShoppingCartIcon fontSize="small" sx={{ color: '#00bcd4' }} />
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {(() => {
                            // Tìm tên sản phẩm từ danh sách products
                            const product = products.find(p => p._id === transaction.product || p.id === transaction.product);
                            return product ? product.name : (transaction.product || 'Không có');
                          })()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium', color: '#00bcd4' }}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.transactionType === 'thu' ? 'Thu' : transaction.transactionType === 'chi' ? 'Chi' : transaction.type}
                        size="small"
                        sx={{
                          bgcolor: transaction.transactionType === 'thu' || transaction.type === 'Thu' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                          color: transaction.transactionType === 'thu' || transaction.type === 'Thu' ? '#4caf50' : '#f44336',
                          fontWeight: 'bold',
                          border: `1px solid ${transaction.transactionType === 'thu' || transaction.type === 'Thu' ? '#4caf50' : '#f44336'}`
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(transaction.status)}
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: transaction.status === 'Đã hoàn thành' ? '#4caf50' : transaction.status === 'Đang xử lý' ? '#ffc107' : '#f44336',
                          color: transaction.status === 'Đã hoàn thành' ? '#4caf50' : transaction.status === 'Đang xử lý' ? '#ffc107' : '#f44336'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {formatDateToDDMMYYYY(transaction.transactionDate || transaction.date)}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{transaction.paymentMethod}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(transaction)}
                        sx={{
                          mr: 1,
                          bgcolor: 'rgba(0, 188, 212, 0.2)',
                          color: '#00bcd4',
                          '&:hover': {
                            bgcolor: 'rgba(0, 188, 212, 0.3)'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(transaction)}
                        sx={{
                          bgcolor: 'rgba(244, 67, 54, 0.2)',
                          color: '#f44336',
                          '&:hover': {
                            bgcolor: 'rgba(244, 67, 54, 0.3)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 10, borderBottom: 'none' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <AccountBalanceIcon sx={{ fontSize: 60, color: 'rgba(0, 188, 212, 0.5)', mb: 2 }} />
                      <Typography variant="h6" gutterBottom color="rgba(255, 255, 255, 0.7)">
                        Chưa có dữ liệu giao dịch
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" mb={3}>
                        Bạn có thể thêm giao dịch mới bằng cách nhấn vào nút "Thêm giao dịch"
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        sx={{
                          borderRadius: '8px',
                          boxShadow: 'none',
                          bgcolor: '#00bcd4',
                          color: '#0d1b2a',
                          fontWeight: 'bold',
                          '&:hover': {
                            bgcolor: '#00acc1'
                          }
                        }}
                      >
                        Thêm giao dịch
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider sx={{ borderColor: 'rgba(0, 188, 212, 0.2)' }} />
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={transactions.length}
          rowsPerPage={rowsPerPage}
          page={transactions.length > 0 ? page : 0}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Dòng trên trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          sx={{
            borderTop: '1px solid rgba(0, 188, 212, 0.2)',
            color: 'rgba(255, 255, 255, 0.7)',
            '& .MuiTablePagination-select': {
              color: 'white'
            },
            '& .MuiTablePagination-selectIcon': {
              color: '#00bcd4'
            },
            '& .MuiIconButton-root': {
              color: '#00bcd4'
            }
          }}
        />
      </Paper>

      {/* Hộp thoại Thêm/Sửa */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#1a2332',
            border: '1px solid rgba(0, 188, 212, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{
          px: 3,
          py: 2,
          bgcolor: '#0d1b2a',
          borderBottom: '1px solid rgba(0, 188, 212, 0.2)'
        }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
            {currentTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderColor: 'rgba(0, 188, 212, 0.2)' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Khách hàng"
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
                placeholder="Nhập tên khách hàng"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#00bcd4'
                  }
                }}
              >
                <InputLabel>Sản phẩm/Dịch vụ</InputLabel>
                <Select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  label="Sản phẩm/Dịch vụ"
                  startAdornment={
                    <InputAdornment position="start">
                      <ShoppingCartIcon fontSize="small" sx={{ color: '#00bcd4' }} />
                    </InputAdornment>
                  }
                  disabled={loadingProducts}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a2332',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            bgcolor: 'rgba(0, 188, 212, 0.1)'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 188, 212, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 188, 212, 0.3)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Không chọn sản phẩm</em>
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product._id || product.id} value={product._id || product.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ShoppingCartIcon fontSize="small" sx={{ color: '#00bcd4' }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          {product.price && (
                            <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                              {formatCurrency(product.price)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {loadingProducts && (
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.5)" sx={{ mt: 1 }}>
                    Đang tải danh sách sản phẩm...
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Số tiền"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
                placeholder="Nhập số tiền giao dịch"
                InputProps={{
                  endAdornment: <InputAdornment position="end" sx={{ color: '#00bcd4' }}>VND</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#00bcd4'
                  }
                }}
              >
                <InputLabel>Loại giao dịch</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Loại giao dịch"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a2332',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            bgcolor: 'rgba(0, 188, 212, 0.1)'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 188, 212, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 188, 212, 0.3)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="Thu">Thu</MenuItem>
                  <MenuItem value="Chi">Chi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Ngày giao dịch"
                name="dateDisplay"
                value={formData.dateDisplay || ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const formattedValue = formatDateInput(inputValue);
                  setFormData({
                    ...formData,
                    dateDisplay: formattedValue
                  });
                }}
                placeholder="DD/MM/YYYY"
                fullWidth
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  maxLength: 10
                }}
                helperText="Nhập theo định dạng: Ngày/Tháng/Năm (VD: 31/12/2025)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#00bcd4'
                  }
                }}
              >
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Trạng thái"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a2332',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            bgcolor: 'rgba(0, 188, 212, 0.1)'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 188, 212, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 188, 212, 0.3)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="Đã hoàn thành">Đã hoàn thành</MenuItem>
                  <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
                  <MenuItem value="Hủy">Hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#00bcd4'
                  }
                }}
              >
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  label="Phương thức thanh toán"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a2332',
                        color: 'white',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            bgcolor: 'rgba(0, 188, 212, 0.1)'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 188, 212, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 188, 212, 0.3)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="Tiền mặt">Tiền mặt</MenuItem>
                  <MenuItem value="Chuyển khoản">Chuyển khoản</MenuItem>
                  <MenuItem value="Thẻ tín dụng">Thẻ tín dụng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                placeholder="Nhập mô tả chi tiết về giao dịch này"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#0d1b2a',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 188, 212, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00bcd4'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#0d1b2a', borderTop: '1px solid rgba(0, 188, 212, 0.2)' }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              borderColor: 'rgba(0, 188, 212, 0.5)',
              color: '#00bcd4',
              '&:hover': {
                borderColor: '#00bcd4',
                backgroundColor: 'rgba(0, 188, 212, 0.1)'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            sx={{
              borderRadius: '8px',
              boxShadow: 'none',
              bgcolor: '#00bcd4',
              color: '#0d1b2a',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#00acc1'
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: '#0d1b2a' }} />
                Đang xử lý...
              </>
            ) : (
              currentTransaction ? 'Cập nhật' : 'Thêm'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hộp thoại Xác nhận xóa */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#1a2332',
            border: '1px solid rgba(0, 188, 212, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{
          px: 3,
          py: 2,
          bgcolor: '#0d1b2a',
          borderBottom: '1px solid rgba(0, 188, 212, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <DeleteIcon sx={{ color: '#f44336' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
            Xác nhận xóa
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Alert severity="warning" sx={{
            mb: 2,
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            color: '#ffc107',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            '& .MuiAlert-icon': {
              color: '#ffc107'
            }
          }}>
            Hành động này không thể hoàn tác sau khi thực hiện.
          </Alert>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Bạn có chắc chắn muốn xóa giao dịch {transactionToDelete?.id ? `#${transactionToDelete._id}` : 'này'} không?
          </Typography>
          {transactionToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#0d1b2a', borderRadius: '8px', border: '1px solid rgba(0, 188, 212, 0.2)' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">Khách hàng:</Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>{transactionToDelete.customer}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">Sản phẩm:</Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>{transactionToDelete.product || 'Không có'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">Số tiền:</Typography>
                  <Typography variant="body1" sx={{ color: '#00bcd4' }}>{formatCurrency(transactionToDelete.amount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">Loại:</Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>{transactionToDelete.type}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">Ngày:</Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>{formatDateToDDMMYYYY(transactionToDelete.date || transactionToDelete.transactionDate)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#0d1b2a', borderTop: '1px solid rgba(0, 188, 212, 0.2)' }}>
          <Button
            onClick={() => setConfirmDeleteOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              borderColor: 'rgba(0, 188, 212, 0.5)',
              color: '#00bcd4',
              '&:hover': {
                borderColor: '#00bcd4',
                backgroundColor: 'rgba(0, 188, 212, 0.1)'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={loading}
            sx={{
              borderRadius: '8px',
              boxShadow: 'none',
              bgcolor: '#f44336',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#d32f2f'
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Đang xử lý...
              </>
            ) : (
              'Xóa'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
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
            boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Transactions;