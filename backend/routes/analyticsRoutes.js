// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const Customer = require('../models/customer');

// Hàm trợ giúp để lấy khoảng thời gian
const getDateRange = (period) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
        case 'week': startDate.setDate(endDate.getDate() - 7); break;
        case 'month': startDate.setMonth(endDate.getMonth() - 1); break;
        case 'quarter': startDate.setMonth(endDate.getMonth() - 3); break;
        case 'year': startDate.setFullYear(endDate.getFullYear() - 1); break;
        default: startDate.setFullYear(endDate.getFullYear() - 1);
    }

    return { startDate, endDate };
};

// API lấy dữ liệu tổng quan cho analytics
router.get('/summary', async (req, res) => {
    try {
        const period = req.query.period || 'year';
        const { startDate, endDate } = getDateRange(period);

        // FIXED: Lấy tất cả giao dịch trước, sau đó filter
        const allTransactions = await Transaction.find({});
        console.log(`Debug: Found ${allTransactions.length} total transactions`);

        // DEBUG: Kiểm tra từng transaction
        console.log('\n=== CHECKING ALL TRANSACTIONS ===');
        allTransactions.forEach((t, index) => {
            const transDate = new Date(t.transactionDate || t.date || t.createdAt);
            const isInRange = transDate >= startDate && transDate <= endDate;
            console.log(`${index + 1}. ID: ${t._id}`);
            console.log(`   Date: ${transDate.toISOString()}`);
            console.log(`   Amount: ${t.amount} ${t.type || t.transactionType}`);
            console.log(`   In range (${startDate.toISOString()} - ${endDate.toISOString()}): ${isInRange}`);
            console.log('---');
        });

        // Filter transactions trong khoảng thời gian
        const transactions = allTransactions.filter(t => {
            const transDate = new Date(t.transactionDate || t.date || t.createdAt);
            return transDate >= startDate && transDate <= endDate;
        });

        console.log(`Debug: Filtered to ${transactions.length} transactions for period ${period}`);

        // Lấy giao dịch kỳ trước để tính tăng trưởng
        const prevPeriodEnd = new Date(startDate);
        const prevPeriodStart = new Date(prevPeriodEnd);

        if (period === 'year') {
            prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 1);
        } else if (period === 'quarter') {
            prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 3);
        } else if (period === 'month') {
            prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
        } else if (period === 'week') {
            prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
        }

        const prevTransactions = await Transaction.find({
            $or: [
                { transactionDate: { $gte: prevPeriodStart, $lt: startDate } },
                { date: { $gte: prevPeriodStart, $lt: startDate } }
            ]
        });

        // Tính tổng doanh số (giao dịch thu)
        const salesTransactions = transactions.filter(t => {
            const isThu = (t.type === 'Thu') || (t.transactionType === 'thu');
            return isThu;
        });

        const prevSalesTransactions = prevTransactions.filter(t => {
            const isThu = (t.type === 'Thu') || (t.transactionType === 'thu');
            return isThu;
        });

        console.log(`Debug: Current period - ${salesTransactions.length} sales transactions`);
        console.log(`Debug: Previous period - ${prevSalesTransactions.length} sales transactions`);

        const totalSales = salesTransactions.reduce((sum, t) => {
            const amount = Number(t.amount) || 0;
            console.log(`Sales: ${amount.toLocaleString()} VNĐ`);
            return sum + amount;
        }, 0);

        const prevTotalSales = prevSalesTransactions.reduce((sum, t) => {
            const amount = Number(t.amount) || 0;
            return sum + amount;
        }, 0);

        console.log(`Debug: Current total sales = ${totalSales.toLocaleString()} VNĐ`);
        console.log(`Debug: Previous total sales = ${prevTotalSales.toLocaleString()} VNĐ`);

        // Lấy và tính tổng số khách hàng
        const allCustomers = await Customer.find({});
        console.log(`Debug: Found ${allCustomers.length} total customers in database`);

        const totalCustomers = await Customer.countDocuments({
            createdAt: { $lte: endDate }
        });

        const prevTotalCustomers = await Customer.countDocuments({
            createdAt: { $lt: startDate }
        });

        console.log(`Debug: Customers created before ${endDate.toISOString()}: ${totalCustomers}`);
        console.log(`Debug: Customers created before ${startDate.toISOString()}: ${prevTotalCustomers}`);
        console.log(`Debug: Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Tạm thời sử dụng tổng số khách hàng thực tế
        const actualTotalCustomers = allCustomers.length;
        console.log(`Debug: Using actual total customers: ${actualTotalCustomers}`);
        // Tính số giao dịch
        const totalTransactions = transactions.length;
        const prevTotalTransactions = prevTransactions.length;

        // Tính giá trị đơn hàng trung bình
        const salesTransactionCount = salesTransactions.length; // Sử dụng biến đã có từ trên
        const averageOrderValue = salesTransactionCount > 0 ? Math.round(totalSales / salesTransactionCount) : 0;

        const prevSalesTransactionCount = prevSalesTransactions.length; // Sử dụng biến đã có từ trên  
        const prevAverageOrderValue = prevSalesTransactionCount > 0 ? Math.round(prevTotalSales / prevSalesTransactionCount) : 0;

        console.log(`Debug: Average Order Value = ${averageOrderValue.toLocaleString()} VNĐ`);

        // Tính tỷ lệ tăng trưởng
        const salesGrowth = prevTotalSales > 0
            ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 100)
            : 0;

        const customerGrowth = prevTotalCustomers > 0
            ? Math.round(((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100)
            : 0;

        const transactionGrowth = prevTotalTransactions > 0
            ? Math.round(((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100)
            : 0;

        const aovGrowth = prevAverageOrderValue > 0
            ? Math.round(((averageOrderValue - prevAverageOrderValue) / prevAverageOrderValue) * 100)
            : 0;

        res.json({
            totalSales: Math.round(totalSales / 1000), // Convert VNĐ to thousands
            totalCustomers: actualTotalCustomers, // Sử dụng số thực tế  
            totalTransactions,
            averageOrderValue: Math.round(averageOrderValue / 1000), // Convert VNĐ to thousands
            salesGrowth,
            customerGrowth,
            transactionGrowth,
            aovGrowth
        });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu analytics:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu analytics' });
    }
});

// API lấy dữ liệu biểu đồ doanh thu
router.get('/revenue-chart', async (req, res) => {
    try {
        const period = req.query.period || 'year';
        const { startDate, endDate } = getDateRange(period);

        // Lấy giao dịch trong khoảng thời gian
        const transactions = await Transaction.find({
            $or: [
                { transactionDate: { $gte: startDate, $lte: endDate } },
                { date: { $gte: startDate, $lte: endDate } }
            ]
        }).sort({ transactionDate: 1, date: 1 });

        // Tạo dữ liệu theo ngày/tháng
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const salesData = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.transactionDate || transaction.date);
            if (!date) return;

            let key;
            if (period === 'week' || period === 'month') {
                // Nhóm theo ngày
                key = date.toISOString().split('T')[0];
            } else {
                // Nhóm theo tháng
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            }

            if (!salesData[key]) {
                const month = monthNames[date.getMonth()];
                salesData[key] = {
                    month: period === 'week' || period === 'month' ? `${date.getDate()} ${month}` : month,
                    year: date.getFullYear(),
                    sales: 0,
                    transactions: 0
                };
            }

            salesData[key].transactions += 1;

            if (transaction.type === 'Thu' || transaction.transactionType === 'thu') {
                salesData[key].sales += (Number(transaction.amount) || 0);
            }
        });

        // Chuyển đổi từ object sang array
        const chartData = Object.values(salesData);

        // Sắp xếp theo thời gian
        chartData.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        });

        res.json(chartData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu biểu đồ doanh thu:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu biểu đồ doanh thu' });
    }
});

// API lấy dữ liệu phân khúc khách hàng
router.get('/customer-segments', async (req, res) => {
    try {
        // Lấy tất cả khách hàng
        const customers = await Customer.find();

        // Lấy tất cả giao dịch
        const transactions = await Transaction.find({
            $or: [
                { type: 'Thu' },
                { transactionType: 'thu' }
            ]
        });

        // Tạo map đếm số giao dịch cho mỗi khách hàng
        const customerTransactionMap = new Map();

        transactions.forEach(transaction => {
            const customerId = transaction.customer ? transaction.customer.toString() :
                transaction.customerId ? transaction.customerId.toString() : null;

            if (!customerId) return;

            if (!customerTransactionMap.has(customerId)) {
                customerTransactionMap.set(customerId, 0);
            }
            customerTransactionMap.set(customerId, customerTransactionMap.get(customerId) + 1);
        });

        // Phân loại khách hàng theo số lượng giao dịch
        let newCount = 0, returningCount = 0, loyalCount = 0, vipCount = 0;

        customerTransactionMap.forEach((transactionCount, customerId) => {
            if (transactionCount === 1) {
                newCount++;
            } else if (transactionCount <= 3) {
                returningCount++;
            } else if (transactionCount <= 6) {
                loyalCount++;
            } else {
                vipCount++;
            }
        });

        // Tính khách hàng không có giao dịch
        const noTransactionCount = customers.length - customerTransactionMap.size;
        newCount += noTransactionCount;

        // Tính phần trăm
        const total = customers.length || 1; // Tránh chia cho 0
        const segments = [
            { name: 'New', value: newCount, percentage: Math.round((newCount / total) * 100) },
            { name: 'Returning', value: returningCount, percentage: Math.round((returningCount / total) * 100) },
            { name: 'Loyal', value: loyalCount, percentage: Math.round((loyalCount / total) * 100) },
            { name: 'VIP', value: vipCount, percentage: Math.round((vipCount / total) * 100) }
        ];

        res.json(segments);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu phân khúc khách hàng:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu phân khúc khách hàng' });
    }
});

// API lấy dữ liệu tăng trưởng khách hàng
router.get('/customer-growth', async (req, res) => {
    try {
        const period = req.query.period || 'year';
        const { startDate, endDate } = getDateRange(period);

        const allTransactions = await Transaction.find({});

        //  Lấy tất cả khách hàng và debug
        const allCustomers = await Customer.find({});
        console.log(`Debug Customer Growth: Found ${allCustomers.length} total customers`);

        // DEBUG: Kiểm tra structure của customer
        console.log('=== CUSTOMER STRUCTURE DEBUG ===');
        if (allCustomers.length > 0) {
            const sampleCustomer = allCustomers[0];
            console.log('Sample customer fields:', Object.keys(sampleCustomer.toObject()));
            console.log('Sample customer:', sampleCustomer.toObject());
        }

        // FIX: Dùng tất cả customers vì không có createdAt
        const customers = allCustomers; // Bypass filter vì createdAt undefined

        console.log(`Debug Customer Growth: Using all ${customers.length} customers (no date filter due to missing createdAt)`);

        // FIXED: Tạo data cho 5 tháng gần đây (đảm bảo có data)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = [];

        // Tạo data cho từng tháng
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        for (let i = 4; i >= 0; i--) {
            let month = currentMonth - i;
            let year = currentYear;

            if (month < 0) {
                month += 12;
                year -= 1;
            }

            // Đếm khách hàng được tạo trong tháng 
            // FIXED: Dùng createdAt ưu tiên, fallback createdDate
            const customersInMonth = customers.filter(customer => {
                // Ưu tiên createdAt (thời gian thật), fallback createdDate (system time)
                const createdDate = new Date(customer.createdAt || customer.createdDate);

                console.log(`Customer ${customer.name}: Date=${createdDate.toISOString().split('T')[0]}`);

                return createdDate.getMonth() === month && createdDate.getFullYear() === year;
            }).length;

            chartData.push({
                month: monthNames[month],
                customers: customersInMonth,
                year: year
            });
        }

        console.log('Debug Customer Growth Chart Data:', chartData);
        res.json(chartData);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu tăng trưởng khách hàng:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu tăng trưởng khách hàng' });
    }
});

// API lấy dữ liệu insights (dữ liệu thô)
router.get('/insights', async (req, res) => {
    try {
        const period = req.query.period || 'year';
        const { startDate, endDate } = getDateRange(period);

        // Lấy giao dịch kỳ hiện tại
        const transactions = await Transaction.find({
            $or: [
                { transactionDate: { $gte: startDate, $lte: endDate } },
                { date: { $gte: startDate, $lte: endDate } }
            ],
            $or: [
                { type: 'Thu' },
                { transactionType: 'thu' }
            ]
        });

        // Lấy giao dịch kỳ trước
        const prevPeriodEnd = new Date(startDate);
        const prevPeriodStart = new Date(prevPeriodEnd);

        if (period === 'year') {
            prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 1);
        } else if (period === 'quarter') {
            prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 3);
        } else if (period === 'month') {
            prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
        } else if (period === 'week') {
            prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
        }

        const prevTransactions = await Transaction.find({
            $or: [
                { transactionDate: { $gte: prevPeriodStart, $lt: startDate } },
                { date: { $gte: prevPeriodStart, $lt: startDate } }
            ],
            $or: [
                { type: 'Thu' },
                { transactionType: 'thu' }
            ]
        });

        // Tính tổng doanh thu
        const totalSales = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const prevTotalSales = prevTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        // Tính tỷ lệ tăng trưởng
        const revenueGrowth = prevTotalSales > 0
            ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 100)
            : 0;

        // Tính giá trị giao dịch trung bình
        const avgValue = transactions.length > 0 ? Math.round(totalSales / transactions.length) : 0;
        const prevAvgValue = prevTransactions.length > 0 ? Math.round(prevTotalSales / prevTransactions.length) : 0;

        const avgGrowth = prevAvgValue > 0
            ? Math.round(((avgValue - prevAvgValue) / prevAvgValue) * 100)
            : 0;

        // Lấy khách hàng trong kỳ
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Tính tỷ lệ giữ chân khách hàng (sử dụng dữ liệu giao dịch)
        const customerIds = [...new Set(transactions.map(t =>
            t.customer ? t.customer.toString() : t.customerId ? t.customerId.toString() : null
        ).filter(id => id !== null))];

        const prevCustomerIds = [...new Set(prevTransactions.map(t =>
            t.customer ? t.customer.toString() : t.customerId ? t.customerId.toString() : null
        ).filter(id => id !== null))];

        const retainedCustomers = customerIds.filter(id => prevCustomerIds.includes(id)).length;
        const retentionRate = prevCustomerIds.length > 0
            ? Math.round((retainedCustomers / prevCustomerIds.length) * 100)
            : 0;

        res.json({
            revenue: {
                current: totalSales,
                previous: prevTotalSales,
                growth: revenueGrowth
            },
            customers: {
                new: newCustomers,
                retention: retentionRate
            },
            transactions: {
                avgValue: avgValue,
                previousAvgValue: prevAvgValue,
                growth: avgGrowth
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy insights:', error);
        res.status(500).json({ message: 'Lỗi khi lấy insights' });
    }
});

module.exports = router;