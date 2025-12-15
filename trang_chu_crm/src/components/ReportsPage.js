import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Fade,
  Chip,
  Stack
} from '@mui/material';
import {
  PictureAsPdf,
  GetApp,
  Print,
  BarChart,
  PieChart,
  Timeline,
  CalendarToday,
  FilterList,
  Refresh,
  TrendingUp,
  Assessment,
  Download
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  LineChart as RechartsLineChart,
  Bar,
  Pie,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Thêm function này vào ReportsPage (sau dòng const API_BASE_URL)
const layDuLieuDoanhSoThat = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/revenue-chart`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log('Lỗi khi gọi API:', error);
    return [];
  }
};

// Danh sách các loại báo cáo có sẵn
const danhSachBaoCao = [
  { id: 'sales', name: 'Báo cáo doanh số', icon: <TrendingUp />, color: '#00bcd4' },
  { id: 'customers', name: 'Báo cáo khách hàng mới', icon: <Assessment />, color: '#00bcd4' },
  { id: 'transactions', name: 'Báo cáo tổng hợp giao dịch', icon: <BarChart />, color: '#00bcd4' },
  { id: 'products', name: 'Báo cáo hiệu suất sản phẩm', icon: <PieChart />, color: '#00bcd4' },
  { id: 'marketing', name: 'Báo cáo chiến dịch marketing', icon: <Timeline />, color: '#00bcd4' },
];

const loaiBieuDo = [
  { id: 'bar', name: 'Biểu đồ cột', icon: <BarChart />, gradient: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)' },
  { id: 'pie', name: 'Biểu đồ tròn', icon: <PieChart />, gradient: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)' },
  { id: 'line', name: 'Biểu đồ đường', icon: <Timeline />, gradient: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)' },
];

// Xử lý data opportunities cho báo cáo bán hàng
const processOpportunitiesData = (opportunities) => {
  const monthlyData = {};

  opportunities.forEach(opp => {
    const date = new Date(opp.expectedCloseDate);
    const monthKey = `Tháng ${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }

    if (opp.stage === 'Đã đóng (Thắng)') {
      monthlyData[monthKey] += opp.value;
    }
  });

  const data = Object.keys(monthlyData).map(month => ({
    month,
    value: monthlyData[month]
  }));

  return {
    title: 'Báo cáo doanh số từ cơ hội bán hàng',
    summary: `Tổng doanh số từ ${opportunities.length} cơ hội`,
    data
  };
};

// Xử lý data customers cho báo cáo khách hàng mới  
const processCustomersData = (customers) => {
  const monthlyData = {};

  customers.forEach(customer => {
    const date = new Date(customer.createdDate || customer.createdAt);
    const monthKey = `Tháng ${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey]++;
  });

  const data = Object.keys(monthlyData).map(month => ({
    month,
    value: monthlyData[month]
  }));

  return {
    title: 'Báo cáo khách hàng mới',
    summary: `Tổng ${customers.length} khách hàng`,
    data
  };
};

// Xử lý data transactions cho báo cáo giao dịch
const processTransactionsData = (transactions) => {
  const monthlyData = {};

  transactions.forEach(trans => {
    const date = new Date(trans.transactionDate);
    const monthKey = `Tháng ${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey]++;
  });

  const data = Object.keys(monthlyData).map(month => ({
    month,
    value: monthlyData[month]
  }));

  return {
    title: 'Báo cáo giao dịch theo tháng',
    summary: `Tổng ${transactions.length} giao dịch`,
    data
  };
};

// Component biểu đồ thực tế sử dụng Recharts
const BieuDoMau = ({ type, data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 350,
        background: '#1e2835',
        borderRadius: 2,
        border: '2px dashed #2d3a4a'
      }}>
        <Typography variant="h6" sx={{ color: '#667a92' }}>
          Không có dữ liệu để hiển thị
        </Typography>
      </Box>
    );
  }

  console.log("Rendering chart with data:", data);
  console.log("Chart type:", type);

  const COLORS = ['#00bcd4', '#26c6da', '#4dd0e1', '#80deea', '#b2ebf2', '#00acc1', '#0097a7'];

  switch (type) {
    case 'bar':
      return (
        <Box sx={{ 
          background: '#1e2835',
          borderRadius: 2,
          p: 2
        }}>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#00bcd4" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#8899a6', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#8899a6', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => {
                  return new Intl.NumberFormat('vi-VN').format(value);
                }}
                contentStyle={{
                  backgroundColor: '#2d3a4a',
                  border: '1px solid #00bcd4',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Legend wrapperStyle={{ color: '#8899a6' }} />
              <Bar dataKey="value" fill="url(#barGradient)" name="Giá trị" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
      );

    case 'pie':
      return (
        <Box sx={{ 
          background: '#1e2835',
          borderRadius: 2,
          p: 3
        }}>
          <div style={{ width: '100%', height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Legend với style đẹp hơn */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              mb: 3,
              justifyContent: 'center'
            }}>
              {data.map((item, index) => {
                const total = data.reduce((sum, dataItem) => sum + dataItem.value, 0);
                const percentage = (item.value / total) * 100;

                return (
                  <Chip
                    key={index}
                    label={`${item.month}: ${percentage.toFixed(1)}%`}
                    sx={{
                      backgroundColor: COLORS[index % COLORS.length],
                      color: 'white',
                      fontWeight: 'bold',
                      '& .MuiChip-label': {
                        fontSize: '0.85rem'
                      }
                    }}
                  />
                );
              })}
            </Box>

            {/* Biểu đồ tròn với canvas */}
            <canvas
              id="pieChartCanvas"
              width="320"
              height="320"
              style={{
                borderRadius: '50%',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                background: '#2d3a4a'
              }}
              ref={(el) => {
                if (el) {
                  const ctx = el.getContext('2d');
                  const total = data.reduce((sum, item) => sum + item.value, 0);
                  let currentAngle = 0;

                  ctx.clearRect(0, 0, el.width, el.height);

                  data.forEach((item, index) => {
                    const sliceAngle = (item.value / total) * 2 * Math.PI;

                    ctx.beginPath();
                    ctx.moveTo(160, 160);
                    ctx.arc(160, 160, 130, currentAngle, currentAngle + sliceAngle);
                    ctx.fillStyle = COLORS[index % COLORS.length];
                    ctx.fill();

                    ctx.lineWidth = 3;
                    ctx.strokeStyle = '#1e2835';
                    ctx.stroke();

                    currentAngle += sliceAngle;
                  });

                  // Vẽ lỗ trung tâm
                  ctx.beginPath();
                  ctx.moveTo(160, 160);
                  ctx.arc(160, 160, 70, 0, 2 * Math.PI);
                  ctx.fillStyle = '#2d3a4a';
                  ctx.fill();
                }
              }}
            />

            {/* Bảng dữ liệu với style mới */}
            <Paper sx={{ 
              mt: 4, 
              width: '100%', 
              maxWidth: '600px',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#2d3a4a',
              border: '1px solid #3a4a5a'
            }}>
              <Box sx={{ 
                background: '#1e2835',
                p: 2,
                borderBottom: '1px solid #3a4a5a'
              }}>
                <Typography variant="h6" sx={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold' }}>
                  Chi tiết dữ liệu
                </Typography>
              </Box>
              <Box sx={{ p: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e2835' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', color: '#8899a6' }}>Phân loại</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#8899a6' }}>Giá trị</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#8899a6' }}>Phần trăm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => {
                      const total = data.reduce((sum, dataItem) => sum + dataItem.value, 0);
                      const percentage = (item.value / total) * 100;

                      return (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #3a4a5a',
                          backgroundColor: index % 2 === 0 ? '#2d3a4a' : '#253140'
                        }}>
                          <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              backgroundColor: COLORS[index % COLORS.length],
                              marginRight: '12px',
                              borderRadius: '50%',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}></div>
                            <span style={{ fontWeight: '500', color: '#ffffff' }}>{item.month}</span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#ffffff' }}>
                            {new Intl.NumberFormat('vi-VN').format(item.value)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <Chip 
                              label={`${percentage.toFixed(1)}%`}
                              size="small"
                              sx={{ 
                                backgroundColor: COLORS[index % COLORS.length],
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            </Paper>
          </div>
        </Box>
      );

    case 'line':
      return (
        <Box sx={{ 
          background: '#1e2835',
          borderRadius: 2,
          p: 2
        }}>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00bcd4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#8899a6', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#8899a6', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => {
                  return new Intl.NumberFormat('vi-VN').format(value);
                }}
                contentStyle={{
                  backgroundColor: '#2d3a4a',
                  border: '1px solid #00bcd4',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Legend wrapperStyle={{ color: '#8899a6' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00bcd4"
                strokeWidth={3}
                activeDot={{ r: 8, fill: '#00bcd4', stroke: '#ffffff', strokeWidth: 2 }}
                name="Giá trị"
                dot={{ fill: '#00bcd4', strokeWidth: 2, stroke: '#ffffff', r: 5 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </Box>
      );

    default:
      return <Typography sx={{ color: '#8899a6' }}>Loại biểu đồ không được hỗ trợ</Typography>;
  }
};

const ReportsPage = () => {
  const [loaiBaoCaoDaChon, setLoaiBaoCaoDaChon] = useState('sales');
  const [loaiBieuDoDaChon, setLoaiBieuDoDaChon] = useState('bar');
  const [tuNgay, setTuNgay] = useState('2023-01-01');
  const [denNgay, setDenNgay] = useState('2023-06-30');
  const [dangTaoBaoCao, setDangTaoBaoCao] = useState(false);
  const [baoCaoDaTao, setBaoCaoDaTao] = useState(false);
  const [thongBao, setThongBao] = useState(false);
  const [duLieuBaoCao, setDuLieuBaoCao] = useState(null);

  // Xử lý khi loại báo cáo thay đổi
  const xuLyThayDoiLoaiBaoCao = (event) => {
    setLoaiBaoCaoDaChon(event.target.value);
    setBaoCaoDaTao(false);
  };

  // Xử lý khi loại biểu đồ thay đổi
  const xuLyThayDoiBieuDo = (event) => {
    setLoaiBieuDoDaChon(event.target.value);
  };

  // Xử lý tạo báo cáo
  const xuLyTaoBaoCao = async () => {
    setDangTaoBaoCao(true);

    // Lấy token từ localStorage
    const token = localStorage.getItem('token');

    // Tạo cấu hình mặc định cho axios
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    try {
      let data;

      // Lấy dữ liệu từ API tương ứng với loại báo cáo
      switch (loaiBaoCaoDaChon) {
        case 'sales':
          try {
            // Lấy dữ liệu doanh số từ API
            const revenueResponse = await axios.get(`${API_BASE_URL}/analytics/revenue-chart`, {
              ...config,
              params: { period: 'year', startDate: tuNgay, endDate: denNgay }
            });

            // Chuyển đổi dữ liệu API sang định dạng cần thiết
            const revenueData = revenueResponse.data.map(item => ({
              month: item.month,
              value: item.sales || 0
            }));

            data = {
              title: 'Báo cáo doanh số theo tháng',
              summary: `Tổng doanh số từ ${tuNgay} đến ${denNgay}`,
              data: revenueData
            };
          } catch (error) {
            console.error("Lỗi khi lấy dữ liệu doanh số:", error);
            data = {
              title: 'Báo cáo doanh số theo tháng',
              summary: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
              data: []
            };
          }
          break;

        case 'customers':
          try {
            // Lấy tất cả khách hàng
            const customersResponse = await axios.get(`${API_BASE_URL}/customers`, { headers: { 'Authorization': `Bearer ${token}` } });
            // Xử lý dữ liệu khách hàng
            data = processCustomersData(customersResponse.data);
          } catch (error) {
            console.error("Lỗi khi lấy dữ liệu khách hàng:", error);
            data = {
              title: 'Báo cáo khách hàng mới',
              summary: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
              data: []
            };
          }
          break;

        case 'transactions':
          try {
            // Lấy tất cả giao dịch
            const transactionsResponse = await axios.get(`${API_BASE_URL}/transactions`, {
              ...config,
              params: { startDate: tuNgay, endDate: denNgay }
            });

            // Xử lý dữ liệu giao dịch
            data = processTransactionsData(transactionsResponse.data);
          } catch (error) {
            console.error("Lỗi khi lấy dữ liệu giao dịch:", error);
            data = {
              title: 'Báo cáo giao dịch theo tháng',
              summary: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
              data: []
            };
          }
          break;

        case 'products':
          try {
            // Lấy dữ liệu cơ hội bán hàng (opportunities)
            const opportunitiesResponse = await axios.get(`${API_BASE_URL}/opportunities`, {
              ...config,
              params: { startDate: tuNgay, endDate: denNgay }
            });

            // Xử lý dữ liệu cơ hội
            data = processOpportunitiesData(opportunitiesResponse.data);
          } catch (error) {
            console.error("Lỗi khi lấy dữ liệu cơ hội:", error);
            data = {
              title: 'Báo cáo hiệu suất sản phẩm',
              summary: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
              data: []
            };
          }
          break;

        case 'marketing':
          try {
            // Lấy dữ liệu hoạt động (activities)
            const activitiesResponse = await axios.get(`${API_BASE_URL}/activities`, {
              ...config,
              params: { startDate: tuNgay, endDate: denNgay }
            });

            // Xử lý dữ liệu hoạt động
            const marketingData = activitiesResponse.data.reduce((acc, activity) => {
              const type = activity.type || 'Khác';
              if (!acc[type]) {
                acc[type] = 0;
              }
              acc[type]++;
              return acc;
            }, {});

            const formattedMarketingData = Object.keys(marketingData).map(key => ({
              month: key,
              value: marketingData[key]
            }));

            data = {
              title: 'Báo cáo chiến dịch marketing',
              summary: `Phân tích hoạt động marketing từ ${tuNgay} đến ${denNgay}`,
              data: formattedMarketingData
            };
          } catch (error) {
            console.error("Lỗi khi lấy dữ liệu hoạt động:", error);
            data = {
              title: 'Báo cáo chiến dịch marketing',
              summary: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
              data: []
            };
          }
          break;

        default:
          data = {
            title: 'Báo cáo chung',
            summary: 'Không có dữ liệu cụ thể',
            data: []
          };
      }

      console.log("Đã tạo dữ liệu báo cáo:", data);
      setDuLieuBaoCao(data);
      setBaoCaoDaTao(true);
    } catch (error) {
      console.error('Lỗi khi tạo báo cáo:', error);
      // Hiển thị thông báo lỗi
      setThongBao(true);
    } finally {
      setDangTaoBaoCao(false);
    }
  };

  // Xử lý xuất báo cáo
  const xuLyXuatBaoCao = (format) => {
    setThongBao(true);
  };

  const currentReport = danhSachBaoCao.find(r => r.id === loaiBaoCaoDaChon);
  const currentChart = loaiBieuDo.find(c => c.id === loaiBieuDoDaChon);

  return (
    <Box sx={{ 
      background: '#0f1419',
      minHeight: '100vh',
      width: '100%',
      p: 3,
      position: 'relative',
      overflow: 'hidden'
    }}>
        {/* Header với gradient đẹp */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #1a2332 0%, #243447 100%)',
          color: 'white',
          borderRadius: 2,
          border: '1px solid #2d3a4a',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 188, 212, 0.2)',
            border: '1px solid #00bcd4',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(0, 188, 212, 0.1), transparent)',
            transition: 'left 0.5s ease',
          },
          '&:hover::before': {
            left: '100%',
          }
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ 
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
              }
            }}>
              <Assessment sx={{ fontSize: 32, color: '#00bcd4', filter: 'drop-shadow(0 0 8px rgba(0, 188, 212, 0.6))' }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" sx={{
                background: 'linear-gradient(90deg, #ffffff 0%, #00bcd4 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Báo Cáo Doanh Thu
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                Theo dõi hiệu suất kinh doanh của bạn
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Bộ lọc báo cáo với thiết kế card đẹp */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1a2332 0%, #243447 100%)',
              border: '1px solid #2d3a4a',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0, 188, 212, 0.15)',
                border: '1px solid rgba(0, 188, 212, 0.3)',
                transform: 'translateY(-2px)',
              }
            }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Box sx={{
                  animation: 'rotate 3s linear infinite',
                  '@keyframes rotate': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }}>
                  <FilterList sx={{ color: '#00bcd4', fontSize: 24, filter: 'drop-shadow(0 0 4px rgba(0, 188, 212, 0.4))' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" color="#ffffff">
                  Tùy chọn báo cáo
                </Typography>
              </Stack>
              <Divider sx={{ mb: 3, borderColor: '#2d3a4a' }} />

              <Grid container spacing={2}>
                {/* Chọn loại báo cáo */}
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#8899a6' }}>Loại báo cáo</InputLabel>
                    <Select
                      value={loaiBaoCaoDaChon}
                      label="Loại báo cáo"
                      onChange={xuLyThayDoiLoaiBaoCao}
                      sx={{
                        borderRadius: 1,
                        backgroundColor: '#253140',
                        color: '#ffffff',
                        transition: 'all 0.3s ease',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2d3a4a',
                          transition: 'all 0.3s ease',
                        },
                        '&:hover': {
                          backgroundColor: '#2d3a4a',
                          boxShadow: '0 0 12px rgba(0, 188, 212, 0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00bcd4',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#2d3a4a',
                          boxShadow: '0 0 16px rgba(0, 188, 212, 0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00bcd4',
                          borderWidth: '2px',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#8899a6',
                          transition: 'all 0.3s ease',
                        },
                        '&:hover .MuiSvgIcon-root': {
                          color: '#00bcd4',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: '#1a2332',
                            border: '1px solid #2d3a4a',
                            '& .MuiMenuItem-root': {
                              color: '#ffffff',
                              '&:hover': {
                                backgroundColor: '#253140',
                              },
                              '&.Mui-selected': {
                                backgroundColor: '#2d3a4a',
                              },
                            },
                          },
                        },
                      }}
                    >
                      {danhSachBaoCao.map((baoCao) => (
                        <MenuItem key={baoCao.id} value={baoCao.id}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ color: baoCao.color, display: 'flex' }}>{baoCao.icon}</Box>
                            <Typography>{baoCao.name}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Chọn kiểu biểu đồ */}
                <Grid item xs={12} md={6} lg={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#8899a6' }}>Kiểu biểu đồ</InputLabel>
                    <Select
                      value={loaiBieuDoDaChon}
                      label="Kiểu biểu đồ"
                      onChange={xuLyThayDoiBieuDo}
                      sx={{
                        borderRadius: 1,
                        backgroundColor: '#253140',
                        color: '#ffffff',
                        transition: 'all 0.3s ease',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2d3a4a',
                          transition: 'all 0.3s ease',
                        },
                        '&:hover': {
                          backgroundColor: '#2d3a4a',
                          boxShadow: '0 0 12px rgba(0, 188, 212, 0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00bcd4',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#2d3a4a',
                          boxShadow: '0 0 16px rgba(0, 188, 212, 0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00bcd4',
                          borderWidth: '2px',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#8899a6',
                          transition: 'all 0.3s ease',
                        },
                        '&:hover .MuiSvgIcon-root': {
                          color: '#00bcd4',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: '#1a2332',
                            border: '1px solid #2d3a4a',
                            '& .MuiMenuItem-root': {
                              color: '#ffffff',
                              '&:hover': {
                                backgroundColor: '#253140',
                              },
                              '&.Mui-selected': {
                                backgroundColor: '#2d3a4a',
                              },
                            },
                          },
                        },
                      }}
                    >
                      {loaiBieuDo.map((bieuDo) => (
                        <MenuItem key={bieuDo.id} value={bieuDo.id}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ color: '#00bcd4', display: 'flex' }}>{bieuDo.icon}</Box>
                            <Typography>{bieuDo.name}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Chọn khoảng thời gian */}
                <Grid item xs={12} md={8} lg={4}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Từ ngày"
                        type="date"
                        value={tuNgay}
                        onChange={(e) => setTuNgay(e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                          sx: { color: '#8899a6' }
                        }}
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: '#253140',
                            color: '#ffffff',
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                              borderColor: '#2d3a4a',
                              transition: 'all 0.3s ease',
                            },
                            '&:hover': {
                              backgroundColor: '#2d3a4a',
                              boxShadow: '0 0 12px rgba(0, 188, 212, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#00bcd4',
                            },
                            '&.Mui-focused': {
                              backgroundColor: '#2d3a4a',
                              boxShadow: '0 0 16px rgba(0, 188, 212, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00bcd4',
                              borderWidth: '2px',
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Đến ngày"
                        type="date"
                        value={denNgay}
                        onChange={(e) => setDenNgay(e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                          sx: { color: '#8899a6' }
                        }}
                        fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: '#253140',
                            color: '#ffffff',
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                              borderColor: '#2d3a4a',
                              transition: 'all 0.3s ease',
                            },
                            '&:hover': {
                              backgroundColor: '#2d3a4a',
                              boxShadow: '0 0 12px rgba(0, 188, 212, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#00bcd4',
                            },
                            '&.Mui-focused': {
                              backgroundColor: '#2d3a4a',
                              boxShadow: '0 0 16px rgba(0, 188, 212, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00bcd4',
                              borderWidth: '2px',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Nút tạo báo cáo */}
                <Grid item xs={12} md={4} lg={2}>
                  <Button
                    variant="contained"
                    onClick={xuLyTaoBaoCao}
                    disabled={dangTaoBaoCao}
                    startIcon={dangTaoBaoCao ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Assessment />}
                    fullWidth
                    sx={{
                      height: 40,
                      borderRadius: 1,
                      background: 'linear-gradient(135deg, #00bcd4 0%, #00acc1 100%)',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transition: 'left 0.5s ease',
                      },
                      '&:hover': {
                        background: 'linear-gradient(135deg, #00acc1 0%, #0097a7 100%)',
                        boxShadow: '0 6px 20px rgba(0, 188, 212, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      '&:hover::before': {
                        left: '100%',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                      },
                      '&:disabled': {
                        background: '#2d3a4a',
                        color: '#667a92',
                        boxShadow: 'none',
                      },
                      animation: dangTaoBaoCao ? 'none' : 'buttonPulse 2s ease-in-out infinite',
                      '@keyframes buttonPulse': {
                        '0%, 100%': { boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)' },
                        '50%': { boxShadow: '0 4px 20px rgba(0, 188, 212, 0.6)' },
                      },
                    }}
                  >
                    {dangTaoBaoCao ? 'Đang tạo...' : 'Tạo báo cáo'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Hiển thị báo cáo */}
        {dangTaoBaoCao && (
          <Fade in={dangTaoBaoCao} timeout={500}>
            <Box>
              <Paper sx={{
                p: 4,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1a2332 0%, #243447 100%)',
                border: '1px solid #2d3a4a',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '200%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(0, 188, 212, 0.1), transparent)',
                  animation: 'shimmer 2s infinite',
                }
              }}>
                <Box sx={{
                  animation: 'pulse 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }}>
                  <Refresh sx={{ 
                    fontSize: 48, 
                    color: '#00bcd4',
                    animation: 'spin 1s linear infinite',
                    filter: 'drop-shadow(0 0 12px rgba(0, 188, 212, 0.6))',
                  }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#ffffff', mt: 2, mb: 1 }}>
                  Đang tạo báo cáo...
                </Typography>
                <Typography variant="body2" sx={{ color: '#8899a6' }}>
                  Vui lòng chờ trong giây lát
                </Typography>
              </Paper>
            </Box>
          </Fade>
        )}
        
        {baoCaoDaTao && duLieuBaoCao && (
          <Fade in={baoCaoDaTao} timeout={500}>
            <Box>
              {/* Header báo cáo */}
              <Paper sx={{ 
                p: 3, 
                mb: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1a2332 0%, #243447 100%)',
                border: '1px solid #2d3a4a',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0, 188, 212, 0.2)',
                  border: '1px solid rgba(0, 188, 212, 0.4)',
                }
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      background: '#00bcd4',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {currentReport?.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="#ffffff">
                        {duLieuBaoCao.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8899a6' }}>
                        {tuNgay} - {denNgay}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PictureAsPdf />}
                      onClick={() => xuLyXuatBaoCao('pdf')}
                      sx={{
                        borderRadius: 1,
                        borderColor: '#f44336',
                        color: '#f44336',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          borderColor: '#f44336',
                          boxShadow: '0 0 12px rgba(244, 67, 54, 0.3)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<GetApp />}
                      onClick={() => xuLyXuatBaoCao('excel')}
                      sx={{
                        borderRadius: 1,
                        borderColor: '#4caf50',
                        color: '#4caf50',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          borderColor: '#4caf50',
                          boxShadow: '0 0 12px rgba(76, 175, 80, 0.3)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      Excel
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Print />}
                      onClick={() => xuLyXuatBaoCao('print')}
                      sx={{
                        borderRadius: 1,
                        borderColor: '#ff9800',
                        color: '#ff9800',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          borderColor: '#ff9800',
                          boxShadow: '0 0 12px rgba(255, 152, 0, 0.3)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      In
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Grid container spacing={2}>
                {/* Thông tin tổng quan */}
                <Grid item xs={12}>
                  <Card sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1e2835 0%, #2a3f5f 100%)',
                    border: '1px solid #2d3a4a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 188, 212, 0.3)',
                      border: '1px solid rgba(0, 188, 212, 0.5)',
                      transform: 'translateY(-4px)',
                    }
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                        <Box sx={{
                          animation: 'bounce 2s ease-in-out infinite',
                          '@keyframes bounce': {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-8px)' },
                          }
                        }}>
                          <TrendingUp sx={{ fontSize: 24, color: '#00bcd4', filter: 'drop-shadow(0 0 8px rgba(0, 188, 212, 0.6))' }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="#ffffff">
                          Tổng quan
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#8899a6' }}>
                        {duLieuBaoCao.summary}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Biểu đồ */}
                <Grid item xs={12}>
                  <Paper sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    minHeight: loaiBieuDoDaChon === 'pie' ? 600 : 500,
                    background: 'linear-gradient(135deg, #1a2332 0%, #243447 100%)',
                    border: '1px solid #2d3a4a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 188, 212, 0.2)',
                      border: '1px solid rgba(0, 188, 212, 0.3)',
                    }
                  }}>
                    <Box sx={{ 
                      background: '#1e2835',
                      p: 2,
                      borderBottom: '1px solid #2d3a4a'
                    }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ color: '#00bcd4', display: 'flex' }}>
                          {currentChart?.icon}
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="#ffffff">
                          {currentChart?.name}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <BieuDoMau type={loaiBieuDoDaChon} data={duLieuBaoCao.data} />
                    </Box>
                  </Paper>
                </Grid>

                {/* Bảng dữ liệu chi tiết */}
                <Grid item xs={12}>
                  <Paper sx={{ 
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1a2332 0%, #243447 100%)',
                    border: '1px solid #2d3a4a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 188, 212, 0.2)',
                      border: '1px solid rgba(0, 188, 212, 0.3)',
                    }
                  }}>
                    <Box sx={{ 
                      background: '#1e2835',
                      p: 2,
                      borderBottom: '1px solid #2d3a4a'
                    }}>
                      <Typography variant="h6" fontWeight="bold" color="#ffffff">
                        Dữ liệu chi tiết
                      </Typography>
                    </Box>
                    <Box sx={{ p: 0 }}>
                      <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ position: 'sticky', top: 0, background: '#1e2835', zIndex: 1 }}>
                            <tr>
                              <th style={{ 
                                padding: '12px 16px', 
                                textAlign: 'left', 
                                fontWeight: 'bold', 
                                color: '#8899a6',
                                borderBottom: '1px solid #2d3a4a'
                              }}>
                                {loaiBaoCaoDaChon === 'products' || loaiBaoCaoDaChon === 'marketing' ? 'Danh mục' : 'Tháng'}
                              </th>
                              <th style={{ 
                                padding: '12px 16px', 
                                textAlign: 'right', 
                                fontWeight: 'bold', 
                                color: '#8899a6',
                                borderBottom: '1px solid #2d3a4a'
                              }}>
                                {loaiBaoCaoDaChon === 'sales' ? 'Doanh số (VNĐ)' :
                                  loaiBaoCaoDaChon === 'customers' ? 'Số lượng khách hàng mới' :
                                    loaiBaoCaoDaChon === 'transactions' ? 'Số giao dịch' :
                                      loaiBaoCaoDaChon === 'marketing' ? 'Tỷ lệ chuyển đổi (%)' : 'Giá trị'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {duLieuBaoCao.data.map((item, index) => (
                              <tr key={index} style={{ 
                                backgroundColor: index % 2 === 0 ? '#1a2332' : '#253140',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#2d3a4a';
                                e.currentTarget.style.transform = 'scale(1.01)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 188, 212, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1a2332' : '#253140';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              >
                                <td style={{ 
                                  padding: '12px 16px', 
                                  borderBottom: '1px solid #2d3a4a',
                                  color: '#ffffff',
                                  fontWeight: '500'
                                }}>
                                  {item.month}
                                </td>
                                <td style={{ 
                                  padding: '12px 16px', 
                                  textAlign: 'right', 
                                  borderBottom: '1px solid #2d3a4a',
                                  fontWeight: 'bold',
                                  color: '#00bcd4'
                                }}>
                                  {loaiBaoCaoDaChon === 'sales'
                                    ? new Intl.NumberFormat('vi-VN').format(item.value)
                                    : loaiBaoCaoDaChon === 'marketing'
                                      ? `${item.value}%`
                                      : item.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Chưa tạo báo cáo */}
        {!baoCaoDaTao && (
          <Fade in={!baoCaoDaTao} timeout={500}>
            <Paper sx={{ 
              p: 5, 
              textAlign: 'center',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1a2332 0%, #243447 100%)',
              border: '2px dashed #2d3a4a',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                border: '2px dashed #00bcd4',
                boxShadow: '0 8px 24px rgba(0, 188, 212, 0.2)',
              }
            }}>
              <Box sx={{
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-10px)' },
                }
              }}>
                <Assessment sx={{ 
                  fontSize: 60, 
                  color: '#00bcd4', 
                  mb: 2, 
                  opacity: 0.5,
                  filter: 'drop-shadow(0 0 8px rgba(0, 188, 212, 0.4))',
                }} />
              </Box>
              <Typography variant="h5" sx={{ color: '#8899a6', mb: 1, fontWeight: 'bold' }}>
                Chưa có báo cáo nào được tạo
              </Typography>
              <Typography variant="body2" sx={{ color: '#667a92', maxWidth: 450, mx: 'auto' }}>
                Vui lòng chọn loại báo cáo, kiểu biểu đồ và khoảng thời gian, sau đó nhấn "Tạo báo cáo" để bắt đầu phân tích dữ liệu
              </Typography>
            </Paper>
          </Fade>
        )}

        {/* Thông báo */}
        <Snackbar
          open={thongBao}
          autoHideDuration={3000}
          onClose={() => setThongBao(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionProps={{
            enter: true,
            exit: true,
          }}
        >
          <Alert 
            onClose={() => setThongBao(false)} 
            severity="success"
            sx={{
              borderRadius: 1,
              backgroundColor: '#1e2835',
              color: '#ffffff',
              border: '1px solid #00bcd4',
              boxShadow: '0 4px 16px rgba(0, 188, 212, 0.3)',
              animation: 'slideIn 0.3s ease-out',
              '@keyframes slideIn': {
                '0%': { transform: 'translateX(100%)', opacity: 0 },
                '100%': { transform: 'translateX(0)', opacity: 1 },
              },
              '& .MuiAlert-icon': {
                color: '#00bcd4',
                filter: 'drop-shadow(0 0 4px rgba(0, 188, 212, 0.6))',
              }
            }}
          >
            Báo cáo đã được xuất thành công!
          </Alert>
        </Snackbar>
    </Box>
  );
};

export default ReportsPage;

/* CSS cho animation */
const globalStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { 
      transform: scale(1);
      opacity: 1;
    }
    50% { 
      transform: scale(1.05);
      opacity: 0.9;
    }
  }
  
  @keyframes bounce {
    0%, 100% { 
      transform: translateY(0);
    }
    50% { 
      transform: translateY(-8px);
    }
  }
  
  @keyframes float {
    0%, 100% { 
      transform: translateY(0px);
    }
    50% { 
      transform: translateY(-10px);
    }
  }
  
  @keyframes rotate {
    0% { 
      transform: rotate(0deg);
    }
    100% { 
      transform: rotate(360deg);
    }
  }
  
  @keyframes slideIn {
    0% { 
      transform: translateX(100%);
      opacity: 0;
    }
    100% { 
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes buttonPulse {
    0%, 100% { 
      box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);
    }
    50% { 
      box-shadow: 0 4px 20px rgba(0, 188, 212, 0.6);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  /* Smooth scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1a2332;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #00bcd4;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #00acc1;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = globalStyles;
  document.head.appendChild(styleElement);
}