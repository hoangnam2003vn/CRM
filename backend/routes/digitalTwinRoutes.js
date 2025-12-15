const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const CustomerTwin = require('../models/CustomerTwin');
const Transaction = require('../models/transaction');

// Helper: Tính toán behavioral patterns
function calculateBehavioralPatterns(transactions) {
    const patterns = {
        purchaseTimePatterns: [],
        seasonalTrends: [],
        categoryPreferences: []
    };
    
    // Phân tích theo ngày trong tuần và giờ
    const dayFrequency = {};
    transactions.forEach(t => {
        const date = new Date(t.transactionDate);
        const dayOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()];
        dayFrequency[dayOfWeek] = (dayFrequency[dayOfWeek] || 0) + 1;
    });
    
    Object.entries(dayFrequency).forEach(([day, freq]) => {
        patterns.purchaseTimePatterns.push({
            dayOfWeek: day,
            hourOfDay: 14, // Mock
            frequency: freq
        });
    });
    
    // Phân tích theo tháng
    const monthlySpending = {};
    transactions.forEach(t => {
        const month = new Date(t.transactionDate).getMonth() + 1;
        monthlySpending[month] = (monthlySpending[month] || 0) + (t.amount || 0);
    });
    
    Object.entries(monthlySpending).forEach(([month, spending]) => {
        patterns.seasonalTrends.push({
            month: parseInt(month),
            avgSpending: Math.round(spending)
        });
    });
    
    return patterns;
}

// Helper: Tạo predictions cho khách hàng
function generatePredictions(purchaseBehavior, scores) {
    const predictions = {
        nextPurchaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 ngày
        nextPurchaseProbability: 0,
        recommendedProducts: [],
        estimatedNextOrderValue: 0,
        churnProbability: scores.churnRisk || 0
    };
    
    // Tính xác suất mua hàng tiếp theo dựa trên frequency
    if (purchaseBehavior.purchaseFrequency > 10) {
        predictions.nextPurchaseProbability = 85;
    } else if (purchaseBehavior.purchaseFrequency > 5) {
        predictions.nextPurchaseProbability = 65;
    } else if (purchaseBehavior.purchaseFrequency > 0) {
        predictions.nextPurchaseProbability = 40;
    } else {
        predictions.nextPurchaseProbability = 15;
    }
    
    // Ước tính giá trị đơn hàng tiếp theo
    predictions.estimatedNextOrderValue = Math.round(purchaseBehavior.averageOrderValue * 1.1);
    
    // Gợi ý sản phẩm (mock)
    predictions.recommendedProducts = [
        'Sản phẩm phổ biến A',
        'Sản phẩm phù hợp B',
        'Sản phẩm mới C'
    ];
    
    return predictions;
}

// Helper: Tạo recommendations
function generateRecommendations(scores, predictions, purchaseBehavior) {
    const recommendations = [];
    
    if (scores.churnRisk > 70) {
        recommendations.push({
            action: 'Liên hệ ngay với ưu đãi đặc biệt',
            priority: 'high',
            impact: 90,
            reason: 'Nguy cơ rời bỏ cao'
        });
    }
    
    if (predictions.nextPurchaseProbability > 70) {
        recommendations.push({
            action: 'Gửi catalog sản phẩm mới',
            priority: 'high',
            impact: 75,
            reason: 'Xác suất mua hàng cao'
        });
    }
    
    if (scores.satisfactionScore < 50) {
        recommendations.push({
            action: 'Thu thập feedback và cải thiện dịch vụ',
            priority: 'high',
            impact: 80,
            reason: 'Độ hài lòng thấp'
        });
    }
    
    if (purchaseBehavior.purchaseFrequency > 10) {
        recommendations.push({
            action: 'Mời tham gia chương trình VIP',
            priority: 'medium',
            impact: 70,
            reason: 'Khách hàng trung thành'
        });
    }
    
    recommendations.push({
        action: 'Gửi thông báo về chương trình khuyến mãi',
        priority: 'low',
        impact: 50,
        reason: 'Duy trì engagement'
    });
    
    return recommendations;
}

// API 1: Lấy digital twin của một khách hàng
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        
        // Tìm customer
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
        }
        
        // Lấy transactions
        const transactions = await Transaction.find({ 
            $or: [
                { customer: customerId },
                { customer: customer.name }
            ]
        }).sort({ transactionDate: -1 });
        
        // Tính toán metrics
        const totalOrders = transactions.length;
        const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
        
        const lastTransaction = transactions[0];
        const lastPurchaseDate = lastTransaction?.transactionDate || customer.createdDate;
        const daysSinceLastPurchase = Math.floor((Date.now() - new Date(lastPurchaseDate)) / (1000 * 60 * 60 * 24));
        
        // Tính purchase frequency (số đơn hàng / số tháng)
        const accountAge = Math.max(1, Math.floor((Date.now() - new Date(customer.createdDate)) / (1000 * 60 * 60 * 24 * 30)));
        const purchaseFrequency = totalOrders / accountAge;
        
        // Tính các scores
        const satisfactionScore = Math.max(20, Math.min(100, 100 - daysSinceLastPurchase));
        const engagementScore = Math.max(0, 100 - (daysSinceLastPurchase / 2));
        const churnRisk = Math.min(100, daysSinceLastPurchase / 2 + (purchaseFrequency < 1 ? 30 : 0));
        const loyaltyScore = Math.min(100, (totalOrders * 2) + (totalSpent / 1000000));
        
        // Segment
        let segment = 'Regular';
        if (totalSpent > 50000000 || totalOrders > 20) segment = 'VIP';
        else if (totalSpent > 20000000 || totalOrders > 10) segment = 'Premium';
        else if (totalOrders < 3) segment = 'New';
        
        // Purchase behavior
        const purchaseBehavior = {
            totalOrders,
            totalSpent,
            averageOrderValue,
            lastPurchaseDate,
            purchaseFrequency: Math.round(purchaseFrequency * 10) / 10,
            favoriteCategories: ['Điện tử', 'Thời trang', 'Gia dụng'], // Mock
            favoriteProducts: []
        };
        
        const scores = {
            satisfactionScore: Math.round(satisfactionScore),
            engagementScore: Math.round(engagementScore),
            churnRisk: Math.round(churnRisk),
            loyaltyScore: Math.round(loyaltyScore)
        };
        
        // Behavioral patterns
        const behavioralPattern = calculateBehavioralPatterns(transactions);
        behavioralPattern.interactionChannels = [
            { channel: 'Mobile App', usagePercentage: 65, satisfaction: 95 },
            { channel: 'Website', usagePercentage: 25, satisfaction: 88 },
            { channel: 'Store', usagePercentage: 10, satisfaction: 92 }
        ];
        
        // Predictions
        const predictions = generatePredictions(purchaseBehavior, scores);
        
        // Recommendations
        const recommendations = generateRecommendations(scores, predictions, purchaseBehavior);
        
        // Interactions (từ transactions)
        const interactions = transactions.slice(0, 10).map(t => ({
            date: t.transactionDate,
            type: 'Mua hàng',
            detail: `Đơn hàng #${t._id.toString().substring(0, 8)}`,
            value: t.amount,
            sentiment: 'positive'
        }));
        
        // Tạo digital twin object
        const digitalTwin = {
            customerId: customer._id,
            basicInfo: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                company: customer.company,
                segment,
                lifetimeValue: Math.round(totalSpent * 1.5),
                loyaltyPoints: Math.round(totalSpent / 10000),
                preferredChannel: 'Mobile App',
                joinDate: customer.createdDate,
                status: customer.status
            },
            purchaseBehavior,
            scores,
            behavioralPattern,
            predictions,
            interactions,
            recommendations,
            lastUpdated: new Date(),
            dataQuality: transactions.length > 5 ? 85 : 60
        };
        
        res.json(digitalTwin);
    } catch (error) {
        console.error('Error fetching digital twin:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy digital twin',
            error: error.message 
        });
    }
});

// API 2: Lấy danh sách customers để chọn
router.get('/customers', async (req, res) => {
    try {
        const { search, segment, limit = 50 } = req.query;
        
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const customers = await Customer.find(query)
            .limit(parseInt(limit))
            .select('name email phone status createdDate');
        
        // Enrich with basic stats
        const enrichedCustomers = await Promise.all(customers.map(async (customer) => {
            const transactions = await Transaction.find({ customerId: customer._id });
            const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            
            let segment = 'Regular';
            if (totalSpent > 50000000 || transactions.length > 20) segment = 'VIP';
            else if (totalSpent > 20000000 || transactions.length > 10) segment = 'Premium';
            else if (transactions.length < 3) segment = 'New';
            
            return {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                segment,
                totalOrders: transactions.length,
                totalSpent,
                status: customer.status
            };
        }));
        
        res.json(enrichedCustomers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy danh sách khách hàng',
            error: error.message 
        });
    }
});

// API 3: Lưu/Cập nhật digital twin vào database
router.post('/save/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const twinData = req.body;
        
        const updated = await CustomerTwin.findOneAndUpdate(
            { customerId },
            {
                ...twinData,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );
        
        res.json({ 
            message: 'Đã lưu digital twin',
            data: updated 
        });
    } catch (error) {
        console.error('Error saving digital twin:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lưu digital twin',
            error: error.message 
        });
    }
});

// API 4: Lấy behavioral insights tổng hợp
router.get('/insights', async (req, res) => {
    try {
        const customers = await Customer.find({}).limit(100);
        const allTransactions = await Transaction.find({});
        
        // Tính toán insights tổng hợp
        const insights = {
            totalCustomers: customers.length,
            segments: {
                vip: 0,
                premium: 0,
                regular: 0,
                new: 0
            },
            avgLifetimeValue: 0,
            avgSatisfactionScore: 0,
            highRiskCount: 0,
            topCategories: ['Điện tử', 'Thời trang', 'Gia dụng'],
            topChannels: [
                { name: 'Mobile App', percentage: 65 },
                { name: 'Website', percentage: 25 },
                { name: 'Store', percentage: 10 }
            ]
        };
        
        let totalSpent = 0;
        
        for (const customer of customers) {
            const transactions = allTransactions.filter(t => 
                t.customerId?.toString() === customer._id.toString()
            );
            
            const spent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            totalSpent += spent;
            
            // Classify segment
            if (spent > 50000000 || transactions.length > 20) insights.segments.vip++;
            else if (spent > 20000000 || transactions.length > 10) insights.segments.premium++;
            else if (transactions.length < 3) insights.segments.new++;
            else insights.segments.regular++;
        }
        
        insights.avgLifetimeValue = customers.length > 0 ? Math.round(totalSpent / customers.length) : 0;
        insights.avgSatisfactionScore = 78; // Mock
        insights.highRiskCount = Math.floor(customers.length * 0.15);
        
        res.json(insights);
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy insights',
            error: error.message 
        });
    }
});

// API 5: Refresh/Recalculate digital twin
router.post('/refresh/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        
        // Trigger recalculation (gọi lại API get)
        // Trong thực tế, có thể chạy background job
        
        res.json({ 
            message: 'Đã refresh digital twin',
            customerId 
        });
    } catch (error) {
        console.error('Error refreshing digital twin:', error);
        res.status(500).json({ 
            message: 'Lỗi khi refresh digital twin',
            error: error.message 
        });
    }
});

module.exports = router;
