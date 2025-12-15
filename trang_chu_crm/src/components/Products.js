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
  CircularProgress
} from '@mui/material';
import {
  Search,
  Add,
  FileDownload,
  Refresh,
  FilterList,
  Edit,
  Delete,
  Inventory,
  AttachMoney,
  Warning,
  CheckCircle,
  Close
} from '@mui/icons-material';

const Products = () => {
  // State cho sản phẩm và tìm kiếm
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  
  // State cho loading và thông báo
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // State cho dialog thêm/sửa sản phẩm
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' hoặc 'edit'
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    stock: 0,
    status: 'Hoạt động',
    supplier: '',
    description: ''
  });

  // State cho xác nhận xóa
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // State cho bộ lọc
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'Tất cả',
    supplier: 'Tất cả',
    minPrice: '',
    maxPrice: ''
  });

  // State cho danh mục và nhà cung cấp
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // State cho thống kê
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    active: 0,
    activeValue: 0,
    inactive: 0,
    inactiveValue: 0
  });

  // API URL
  const API_URL = 'http://localhost:5000/api';

  // Lấy dữ liệu sản phẩm từ API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      
      // Thiết lập headers với token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Gọi API lấy danh sách sản phẩm
      const response = await axios.get(`${API_URL}/products`, config);
      
      setProducts(response.data);
      
      // Gọi API lấy thống kê
      fetchStats(token);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setNotification({
        open: true,
        message: 'Không thể tải dữ liệu sản phẩm',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Lấy thống kê từ API thay vì tính toán ở frontend
  const fetchStats = async (token) => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/products/stats/summary`, config);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Nếu không lấy được thống kê từ API, tính toán ở frontend như trước
      calculateStats();
    }
  };

  // Tính toán thống kê ở frontend (chỉ dùng khi API thống kê bị lỗi)
  const calculateStats = () => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    
    const activeProducts = products.filter(product => product.status === 'Hoạt động');
    const activeValue = activeProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
    
    const inactiveProducts = products.filter(product => product.status === 'Ngừng bán');
    const inactiveValue = inactiveProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
    
    setStats({
      total: totalProducts,
      totalValue: totalValue,
      active: activeProducts.length,
      activeValue: activeValue,
      inactive: inactiveProducts.length,
      inactiveValue: inactiveValue
    });
  };

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products/categories/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  // Lấy danh sách nhà cung cấp
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products/suppliers/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuppliers(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  };

  // Gọi API khi component được mount
  useEffect(() => {
    const initData = async () => {
      await fetchProducts();
      await fetchCategories();
      await fetchSuppliers();
    };
    
    initData();
  }, []);

  // Lọc sản phẩm dựa trên tìm kiếm và bộ lọc
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'Tất cả' || product.status === filterStatus;
    
    const matchesCategory = 
      filters.category === 'Tất cả' || product.category === filters.category;
    
    const matchesSupplier = 
      filters.supplier === 'Tất cả' || product.supplier === filters.supplier;
    
    const matchesPrice = 
      (filters.minPrice === '' || product.price >= parseFloat(filters.minPrice)) &&
      (filters.maxPrice === '' || product.price <= parseFloat(filters.maxPrice));
    
    return matchesSearch && matchesStatus && matchesCategory && matchesSupplier && matchesPrice;
  });

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  // Lấy màu cho danh mục - Đổi sang tông màu xanh nước biển
  const getCategoryColor = (category) => {
    const colors = {
      'Điện tử': '#0077BE',      // Deep Ocean Blue
      'Máy tính': '#00A8CC',     // Cyan Blue
      'Âm thanh': '#0093AF'      // Teal Blue
    };
    return colors[category] || '#006994'; // Default Ocean Blue
  };

  // Xử lý đóng thông báo
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Xử lý mở dialog thêm sản phẩm
  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setFormData({
      name: '',
      sku: '',
      category: '',
      price: 0,
      stock: 0,
      status: 'Hoạt động',
      supplier: '',
      description: ''
    });
    setDialogOpen(true);
  };

  // Xử lý mở dialog sửa sản phẩm
  const handleOpenEditDialog = (product) => {
    setDialogMode('edit');
    setCurrentProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || '',
      price: product.price || 0,
      stock: product.stock || 0,
      status: product.status || 'Hoạt động',
      supplier: product.supplier || '',
      description: product.description || ''
    });
    setDialogOpen(true);
  };

  // Xử lý đóng dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentProduct(null);
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý thêm sản phẩm
  const handleAddProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.post(`${API_URL}/products`, formData, config);
      
      setNotification({
        open: true,
        message: 'Thêm sản phẩm thành công',
        severity: 'success'
      });
      
      handleCloseDialog();
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Không thể thêm sản phẩm',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Xử lý cập nhật sản phẩm
  const handleUpdateProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.put(`${API_URL}/products/${currentProduct.id}`, formData, config);
      
      setNotification({
        open: true,
        message: 'Cập nhật sản phẩm thành công',
        severity: 'success'
      });
      
      handleCloseDialog();
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Không thể cập nhật sản phẩm',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Xử lý mở dialog xóa
  const handleOpenDeleteConfirm = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  // Xử lý đóng dialog xóa
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  // Xử lý xóa sản phẩm
  const handleDeleteProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.delete(`${API_URL}/products/${productToDelete.id}`, config);
      
      setNotification({
        open: true,
        message: 'Xóa sản phẩm thành công',
        severity: 'success'
      });
      
      handleCloseDeleteConfirm();
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Không thể xóa sản phẩm',
        severity: 'error'
      });
      setLoading(false);
    }
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
      category: 'Tất cả',
      supplier: 'Tất cả',
      minPrice: '',
      maxPrice: ''
    });
  };

  // Xử lý xuất Excel
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      };
      
      const response = await axios.get(`${API_URL}/products/export`, config);
      
      // Tạo URL để download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setNotification({
        open: true,
        message: 'Xuất dữ liệu thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting products:', error);
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
      background: 'linear-gradient(135deg, #0a1929 0%, #1a3a52 100%)', // Nền xanh đậm như trong ảnh
      py: 4 
    }}>
    <Container maxWidth="xl">
      {/* Header với màu xanh nước biển */}
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
          <Inventory sx={{ fontSize: 40 }} />
          Quản lý sản phẩm
        </Typography>
      </Box>

      {/* Thống kê với tone màu xanh */}
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
                <Inventory sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Tổng sản phẩm</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Giá trị: {formatPrice(stats.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
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
                <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Đang hoạt động</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.active}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Giá trị: {formatPrice(stats.activeValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
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
                <Warning sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Ngừng bán</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.inactive}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Giá trị: {formatPrice(stats.inactiveValue)}
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
                placeholder="Tìm kiếm sản phẩm..."
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
                <InputLabel sx={{ color: '#006994' }}>Trạng thái</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Trạng thái"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0077BE',
                    }
                  }}
                >
                  <MenuItem value="Tất cả">Tất cả</MenuItem>
                  <MenuItem value="Hoạt động">Hoạt động</MenuItem>
                  <MenuItem value="Ngừng bán">Ngừng bán</MenuItem>
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
                  onClick={fetchProducts}
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
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenAddDialog}
                  sx={{ 
                    background: 'linear-gradient(135deg, #0077BE 0%, #00A8CC 100%)',
                    boxShadow: '0 4px 15px rgba(0, 119, 190, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #006994 0%, #0093AF 100%)',
                      boxShadow: '0 6px 20px rgba(0, 119, 190, 0.5)'
                    }
                  }}
                >
                  Thêm sản phẩm
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bảng sản phẩm */}
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
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>SKU</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Danh mục</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Giá bán</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tồn kho</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nhà cung cấp</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow 
                      key={product._id || product.id || index}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 119, 190, 0.05)',
                          transition: 'background-color 0.3s ease'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500, color: '#006994' }}>{product.sku}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={product.category}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(product.category),
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#0077BE', fontWeight: 600 }}>
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.stock}
                          size="small"
                          sx={{
                            backgroundColor: product.stock > 50 ? '#00A8CC' : 
                                           product.stock > 20 ? '#00C9DB' : '#FF6B6B',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          size="small"
                          icon={product.status === 'Hoạt động' ? <CheckCircle /> : <Warning />}
                          sx={{
                            backgroundColor: product.status === 'Hoạt động' ? '#0093AF' : '#B0BEC5',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>{product.supplier}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenEditDialog(product)}
                          sx={{ 
                            color: '#0077BE',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 119, 190, 0.1)'
                            }
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDeleteConfirm(product)}
                          sx={{ 
                            color: '#006994',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 105, 148, 0.1)'
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm/sửa sản phẩm */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
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
          {dialogMode === 'add' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
          <IconButton 
            onClick={handleCloseDialog}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tên sản phẩm"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
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
                label="Mã SKU"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                disabled={dialogMode === 'edit'}
                helperText={dialogMode === 'edit' ? 'Không thể thay đổi SKU' : ''}
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
                label="Giá bán"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">₫</InputAdornment>,
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
                label="Số lượng tồn kho"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
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
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ '&.Mui-focused': { color: '#0077BE' } }}>Danh mục</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Danh mục"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0077BE',
                    }
                  }}
                >
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))
                  ) : (
                    <>
                      <MenuItem value="Điện tử">Điện tử</MenuItem>
                      <MenuItem value="Máy tính">Máy tính</MenuItem>
                      <MenuItem value="Âm thanh">Âm thanh</MenuItem>
                      <MenuItem value="Phụ kiện">Phụ kiện</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ '&.Mui-focused': { color: '#0077BE' } }}>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Trạng thái"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0077BE',
                    }
                  }}
                >
                  <MenuItem value="Hoạt động">Hoạt động</MenuItem>
                  <MenuItem value="Ngừng bán">Ngừng bán</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nhà cung cấp"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
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
            <Grid item xs={12}>
              <TextField
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
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
            onClick={handleCloseDialog}
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
            onClick={dialogMode === 'add' ? handleAddProduct : handleUpdateProduct}
            disabled={loading}
            sx={{ 
              background: 'linear-gradient(135deg, #0077BE 0%, #00A8CC 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #006994 0%, #0093AF 100%)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : dialogMode === 'add' ? 'Thêm sản phẩm' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '2px solid #ffcdd2'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #006994 0%, #0077BE 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Xác nhận xóa sản phẩm
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Bạn có chắc chắn muốn xóa sản phẩm "<strong>{productToDelete?.name}</strong>"?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDeleteConfirm}
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
            onClick={handleDeleteProduct}
            disabled={loading}
            sx={{ 
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#c62828'
              }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Xóa'}
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
          Bộ lọc sản phẩm
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
                <InputLabel sx={{ '&.Mui-focused': { color: '#0077BE' } }}>Danh mục</InputLabel>
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  label="Danh mục"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0077BE',
                    }
                  }}
                >
                  <MenuItem value="Tất cả">Tất cả</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ '&.Mui-focused': { color: '#0077BE' } }}>Nhà cung cấp</InputLabel>
                <Select
                  name="supplier"
                  value={filters.supplier}
                  onChange={handleFilterChange}
                  label="Nhà cung cấp"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0077BE',
                    }
                  }}
                >
                  <MenuItem value="Tất cả">Tất cả</MenuItem>
                  {suppliers.map(supplier => (
                    <MenuItem key={supplier} value={supplier}>{supplier}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Giá tối thiểu"
                name="minPrice"
                type="number"
                value={filters.minPrice}
                onChange={handleFilterChange}
                fullWidth
                margin="normal"
                InputProps={{
                  endAdornment: <InputAdornment position="end">₫</InputAdornment>,
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
                label="Giá tối đa"
                name="maxPrice"
                type="number"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                fullWidth
                margin="normal"
                InputProps={{
                  endAdornment: <InputAdornment position="end">₫</InputAdornment>,
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

export default Products;