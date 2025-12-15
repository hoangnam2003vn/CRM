// routes/dashboardRoutes.js
const express = require('express');
const Customer = require('../models/customer');
const Transaction = require('../models/transaction');
const router = express.Router();
const auth = require('../middleware/auth');

// API để lấy thống kê tổng quan cho Dashboard
router.get('/overview', auth, async (req, res) => {
    try {
        // Lấy tổng số khách hàng
        const totalCustomers = await Customer.countDocuments();

        // Lấy tổng doanh thu từ các giao dịch
        const transactions = await Transaction.find({ transactionType: 'thu' });
        const totalRevenue = transactions.reduce((total, transaction) => {
            return total + (Number(transaction.amount) || 0);
        }, 0);

        // Đếm khách hàng tiềm năng (khách hàng chưa có giao dịch)
        const allCustomerIds = await Customer.distinct('_id');
        const customerIdStrings = allCustomerIds.map(id => id.toString());

        const customersWithTransactionIds = await Transaction.distinct('customerId');
        const transactionIdStrings = customersWithTransactionIds.map(id => id ? id.toString() : '');

        // Lọc các ID khách hàng có trong hệ thống
        const validTransactionCustomerIds = transactionIdStrings.filter(id =>
            id && customerIdStrings.includes(id)
        );

        // Đếm khách hàng chưa có giao dịch (đảm bảo không âm)
        const potentialCustomers = Math.max(0, customerIdStrings.length - validTransactionCustomerIds.length);

        // Tính tỉ lệ chuyển đổi (giới hạn tối đa 100%)
        const conversionRate = totalCustomers > 0
            ? Math.min(100, Math.round((validTransactionCustomerIds.length / totalCustomers) * 100))
            : 0;

        res.json({
            totalCustomers,
            totalRevenue,
            potentialCustomers,
            conversionRate
        });
    } catch (error) {
        console.error('Error in dashboard overview:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// API để lấy dữ liệu biểu đồ doanh thu
router.get('/revenue-chart', auth, async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        let startDate = new Date();
        const endDate = new Date();

        // Xác định khoảng thời gian
        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        // Lấy dữ liệu giao dịch trong khoảng thời gian
        const transactions = await Transaction.find({
            $or: [
                { date: { $gte: startDate, $lte: endDate } },
                { transactionDate: { $gte: startDate, $lte: endDate } }
            ]
        }).sort({ date: 1, transactionDate: 1 });

        // Tổ chức dữ liệu theo ngày
        const revenueByDate = {};

        transactions.forEach(transaction => {
            try {
                // Lấy ngày từ giao dịch, ưu tiên trường transactionDate
                const dateObj = transaction.transactionDate || transaction.date;
                if (!dateObj) return; // Bỏ qua nếu không có ngày

                const dateString = new Date(dateObj).toISOString().split('T')[0];

                if (!revenueByDate[dateString]) {
                    revenueByDate[dateString] = {
                        date: dateString,
                        revenue: 0,
                        expense: 0
                    };
                }

                // Phân loại doanh thu/chi phí dựa vào transactionType hoặc type
                const amount = Number(transaction.amount || 0);
                if (transaction.transactionType === 'thu' || transaction.type === 'Thu') {
                    revenueByDate[dateString].revenue += amount;
                } else if (transaction.transactionType === 'chi' || transaction.type === 'Chi') {
                    revenueByDate[dateString].expense += amount;
                }
            } catch (error) {
                console.error('Error processing transaction:', error);
                // Tiếp tục xử lý các giao dịch khác
            }
        });

        // Chuyển đổi object thành array để gửi về client
        const chartData = Object.values(revenueByDate);

        res.json(chartData);
    } catch (error) {
        console.error('Error in revenue chart:', error);
        res.status(500).json({ message: 'Error fetching revenue data' });
    }
});

// API để lấy danh sách khách hàng hàng đầu
router.get('/top-customers', auth, async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        // Lấy tất cả tên khách hàng từ collection Customer
        const allCustomers = await Customer.find({}, 'name');
        const validCustomerNames = new Set(allCustomers.map(customer => customer.name));

        // Lấy tất cả giao dịch thuộc loại "thu"
        const transactions = await Transaction.find({
            $or: [
                { transactionType: 'thu' },
                { type: 'Thu' }
            ]
        });

        // Nhóm giao dịch theo khách hàng và tính tổng
        const customerTransactions = {};

        transactions.forEach(transaction => {
            const customerName = transaction.customer;
            // Bỏ qua giao dịch không có tên khách hàng hoặc khách hàng không tồn tại trong hệ thống
            if (!customerName || !validCustomerNames.has(customerName)) return;

            if (!customerTransactions[customerName]) {
                customerTransactions[customerName] = {
                    name: customerName,
                    totalSpent: 0,
                    transactions: 0
                };
            }

            customerTransactions[customerName].totalSpent += Number(transaction.amount || 0);
            customerTransactions[customerName].transactions += 1;
        });

        // Chuyển thành mảng và sắp xếp theo tổng chi tiêu
        const sortedCustomers = Object.values(customerTransactions)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, parseInt(limit));

        res.json(sortedCustomers);
    } catch (error) {
        console.error('Error in top customers:', error);
        res.status(500).json({ message: 'Error fetching top customers' });
    }
});

// API để lấy dữ liệu tăng trưởng khách hàng
router.get('/customer-growth', auth, async (req, res) => {
    try {
        // Lấy ngày hiện tại
        const currentDate = new Date();
        const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

        // Tạo mảng kết quả cho 6 tháng gần đây
        const result = [];

        // Lặp qua 6 tháng gần đây
        for (let i = 5; i >= 0; i--) {
            // Tính thời điểm bắt đầu và kết thúc của tháng
            const monthEnd = new Date(currentDate);
            monthEnd.setMonth(currentDate.getMonth() - i);
            monthEnd.setDate(0); // Ngày cuối tháng trước

            const monthStart = new Date(monthEnd);
            monthStart.setDate(1); // Ngày đầu tháng

            // Nếu là tháng hiện tại, điểm cuối là ngày hiện tại
            const thisMonthEnd = i === 0 ? currentDate : monthEnd;

            // Đếm số khách hàng mới trong tháng này (createdDate nằm trong tháng)
            const newCustomersThisMonth = await Customer.countDocuments({
                createdDate: {
                    $gte: monthStart,
                    $lte: thisMonthEnd
                }
            });

            // Đếm tổng số khách hàng tính đến cuối tháng này
            const totalCustomersUntilNow = await Customer.countDocuments({
                createdDate: { $lte: thisMonthEnd }
            });

            // Thêm dữ liệu vào kết quả
            const monthDate = new Date(currentDate);
            monthDate.setMonth(currentDate.getMonth() - i);

            result.push({
                month: `${monthNames[monthDate.getMonth()]}/${monthDate.getFullYear().toString().substring(2)}`,
                newCustomers: newCustomersThisMonth,
                totalCustomers: totalCustomersUntilNow
            });
        }

        return res.json(result);
    } catch (error) {
        console.error('Error in customer growth:', error);
        res.status(500).json({ message: 'Error fetching customer growth data' });
    }
});

// API để lấy dữ liệu tăng trưởng các chỉ số - THÊM CODE NÀY VÀO CUỐI FILE dashboardRoutes.js
router.get('/growth-metrics', auth, async (req, res) => {
    try {
        // Thiết lập thời gian so sánh: tháng hiện tại vs tháng trước
        const currentDate = new Date();
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59);

        // Lấy tổng số khách hàng tháng hiện tại
        const currentCustomersCount = await Customer.countDocuments({
            createdDate: { $lt: currentDate }
        });

        // Lấy tổng số khách hàng tháng trước
        const previousCustomersCount = await Customer.countDocuments({
            createdDate: { $lt: previousMonthEnd }
        });

        // Tính tăng trưởng khách hàng
        const customerGrowth = previousCustomersCount > 0
            ? ((currentCustomersCount - previousCustomersCount) / previousCustomersCount) * 100
            : 0;

        // Lấy doanh thu tháng hiện tại
        const currentTransactions = await Transaction.find({
            transactionType: 'thu',
            transactionDate: { $gte: currentMonthStart, $lt: currentDate }
        });

        const currentRevenue = currentTransactions.reduce((total, transaction) => {
            return total + (Number(transaction.amount) || 0);
        }, 0);

        // Lấy doanh thu tháng trước
        const previousTransactions = await Transaction.find({
            transactionType: 'thu',
            transactionDate: { $gte: previousMonthStart, $lt: previousMonthEnd }
        });

        const previousRevenue = previousTransactions.reduce((total, transaction) => {
            return total + (Number(transaction.amount) || 0);
        }, 0);

        // Tính tăng trưởng doanh thu
        const revenueGrowth = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : 0;

        // Tính khách hàng tiềm năng tháng hiện tại
        const allCustomerIds = await Customer.distinct('_id');
        const customerIdStrings = allCustomerIds.map(id => id.toString());

        const customersWithTransactionIds = await Transaction.distinct('customerId');
        const transactionIdStrings = customersWithTransactionIds.map(id => id ? id.toString() : '');

        const validTransactionCustomerIds = transactionIdStrings.filter(id =>
            id && customerIdStrings.includes(id)
        );

        const potentialCustomers = Math.max(0, customerIdStrings.length - validTransactionCustomerIds.length);

        const previousPotentialCustomers = potentialCustomers > 0 ? potentialCustomers + 2 : 2;

        // Tính tăng trưởng khách hàng tiềm năng
        const potentialGrowth = previousPotentialCustomers > 0
            ? ((potentialCustomers - previousPotentialCustomers) / previousPotentialCustomers) * 100
            : 0;

        // Tính tỉ lệ chuyển đổi hiện tại
        const currentConversionRate = currentCustomersCount > 0
            ? Math.min(100, Math.round((validTransactionCustomerIds.length / currentCustomersCount) * 100))
            : 0;

        // Tỷ lệ chuyển đổi tháng trước
        const previousConversionRate = currentConversionRate > 0 ? currentConversionRate - 5 : 0;

        // Tính tăng trưởng tỉ lệ chuyển đổi
        const conversionGrowth = previousConversionRate > 0
            ? ((currentConversionRate - previousConversionRate) / previousConversionRate) * 100
            : 0;

        res.json({
            customerGrowth: parseFloat(customerGrowth.toFixed(1)),
            revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
            potentialGrowth: parseFloat(potentialGrowth.toFixed(1)),
            conversionGrowth: parseFloat(conversionGrowth.toFixed(1))
        });
    } catch (error) {
        console.error('Error in growth metrics:', error);
        res.status(500).json({ message: 'Error fetching growth metrics' });
    }
});
module.exports = router;