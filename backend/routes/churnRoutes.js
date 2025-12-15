const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const ChurnPrediction = require('../models/ChurnPrediction');
const Transaction = require('../models/transaction');

// Helper function: Tính toán churn score dựa trên các yếu tố
function calculateChurnScore(customerData) {
    let score = 0;
    
    // Yếu tố 1: Thời gian từ lần mua cuối (40% trọng số)
    const daysSinceLastPurchase = customerData.daysSinceLastPurchase || 0;
    if (daysSinceLastPurchase > 120) score += 40;
    else if (daysSinceLastPurchase > 90) score += 30;
    else if (daysSinceLastPurchase > 60) score += 20;
    else if (daysSinceLastPurchase > 30) score += 10;
    
    // Yếu tố 2: Tần suất mua hàng giảm (30% trọng số)
    const frequency = customerData.purchaseFrequency || 0;
    if (frequency < 1) score += 30;
    else if (frequency < 2) score += 20;
    else if (frequency < 3) score += 10;
    
    // Yếu tố 3: Engagement score thấp (20% trọng số)
    const engagement = customerData.engagementScore || 50;
    if (engagement < 30) score += 20;
    else if (engagement < 50) score += 15;
    else if (engagement < 70) score += 10;
    
    // Yếu tố 4: Giá trị đơn hàng giảm (10% trọng số)
    const avgOrderValue = customerData.averageOrderValue || 0;
    if (avgOrderValue < 500000) score += 10;
    else if (avgOrderValue < 1000000) score += 5;
    
    return Math.min(score, 100);
}

// Xác định risk level dựa trên churn score
function getRiskLevel(churnScore) {
    if (churnScore >= 70) return 'Cao';
    if (churnScore >= 40) return 'Trung bình';
    return 'Thấp';
}

// Tạo danh sách các yếu tố rủi ro
function generateRiskFactors(customerData, churnScore) {
    const factors = [];
    
    if (customerData.daysSinceLastPurchase > 90) {
        factors.push('Không mua hàng trong ' + Math.floor(customerData.daysSinceLastPurchase / 30) + ' tháng');
    }
    if (customerData.purchaseFrequency < 2) {
        factors.push('Giảm tần suất mua hàng');
    }
    if (customerData.engagementScore < 50) {
        factors.push('Tương tác thấp với hệ thống');
    }
    if (customerData.averageOrderValue < 500000) {
        factors.push('Giảm giá trị đơn hàng trung bình');
    }
    if (churnScore < 30) {
        factors.push('Khách hàng trung thành, hoạt động ổn định');
    }
    
    if (factors.length === 0) {
        factors.push('Không có yếu tố rủi ro đáng kể');
    }
    
    return factors;
}

// Tạo recommendations dựa trên risk level
function generateRecommendations(riskLevel, customerData) {
    const recommendations = [];
    
    if (riskLevel === 'Cao') {
        recommendations.push({
            action: 'Liên hệ trực tiếp và tặng voucher đặc biệt',
            priority: 'high',
            estimatedImpact: 85
        });
        recommendations.push({
            action: 'Gửi email cá nhân hóa với ưu đãi độc quyền',
            priority: 'high',
            estimatedImpact: 75
        });
        recommendations.push({
            action: 'Mời tham gia chương trình VIP/Loyalty',
            priority: 'medium',
            estimatedImpact: 65
        });
    } else if (riskLevel === 'Trung bình') {
        recommendations.push({
            action: 'Gửi thông báo về sản phẩm mới phù hợp',
            priority: 'medium',
            estimatedImpact: 60
        });
        recommendations.push({
            action: 'Tặng điểm thưởng loyalty',
            priority: 'medium',
            estimatedImpact: 55
        });
        recommendations.push({
            action: 'Khảo sát ý kiến và feedback',
            priority: 'low',
            estimatedImpact: 40
        });
    } else {
        recommendations.push({
            action: 'Duy trì chương trình chăm sóc hiện tại',
            priority: 'low',
            estimatedImpact: 50
        });
        recommendations.push({
            action: 'Gửi newsletter định kỳ',
            priority: 'low',
            estimatedImpact: 35
        });
    }
    
    return recommendations;
}

// API 1: Lấy danh sách dự đoán churn cho tất cả khách hàng
router.get('/predictions', async (req, res) => {
    try {
        const { riskLevel, minScore, maxScore, segment } = req.query;
        
        // Lấy tất cả khách hàng
        const customers = await Customer.find({});
        
        // Lấy transactions để tính toán
        const transactions = await Transaction.find({});
        
        const predictions = [];
        
        for (const customer of customers) {
            // Tính toán metrics từ transactions
            const customerTransactions = transactions.filter(t => 
                t.customer?.toString() === customer._id.toString() ||
                t.customer?.toString() === customer.name
            );
            
            const totalSpent = customerTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const lastTransaction = customerTransactions.sort((a, b) => 
                new Date(b.transactionDate) - new Date(a.transactionDate)
            )[0];
            
            const daysSinceLastPurchase = lastTransaction 
                ? Math.floor((Date.now() - new Date(lastTransaction.transactionDate)) / (1000 * 60 * 60 * 24))
                : 999;
            
            const purchaseFrequency = customerTransactions.length;
            const averageOrderValue = purchaseFrequency > 0 ? totalSpent / purchaseFrequency : 0;
            const engagementScore = Math.max(0, 100 - (daysSinceLastPurchase / 2));
            
            const customerData = {
                daysSinceLastPurchase,
                purchaseFrequency,
                averageOrderValue,
                engagementScore,
                totalSpent
            };
            
            // Tính churn score
            const churnScore = calculateChurnScore(customerData);
            const riskLevelCalc = getRiskLevel(churnScore);
            const factors = generateRiskFactors(customerData, churnScore);
            const recommendations = generateRecommendations(riskLevelCalc, customerData);
            
            // Dự đoán revenue loss (30% của tổng chi tiêu nếu rời bỏ)
            const predictedRevenueLoss = Math.floor(totalSpent * 0.3);
            
            // Áp dụng filters
            if (riskLevel && riskLevelCalc !== riskLevel) continue;
            if (minScore && churnScore < parseFloat(minScore)) continue;
            if (maxScore && churnScore > parseFloat(maxScore)) continue;
            
            predictions.push({
                id: customer._id,
                customerId: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                segment: customer.status === 'VIP' ? 'VIP' : 
                         purchaseFrequency > 10 ? 'Trung thành' :
                         purchaseFrequency > 5 ? 'Thường xuyên' : 'Mới',
                churnScore,
                riskLevel: riskLevelCalc,
                lastPurchase: lastTransaction?.transactionDate || customer.createdDate,
                totalSpent,
                predictedRevenueLoss,
                factors,
                recommendations,
                daysSinceLastPurchase,
                purchaseFrequency,
                averageOrderValue,
                engagementScore
            });
        }
        
        // Sort by churn score descending
        predictions.sort((a, b) => b.churnScore - a.churnScore);
        
        res.json(predictions);
    } catch (error) {
        console.error('Error fetching churn predictions:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy dự đoán churn',
            error: error.message 
        });
    }
});

// API 2: Lấy dự đoán churn cho một khách hàng cụ thể
router.get('/predictions/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
        }
        
        const transactions = await Transaction.find({ 
            $or: [
                { customer: customerId },
                { customer: customer.name }
            ]
        });
        
        const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const lastTransaction = transactions.sort((a, b) => 
            new Date(b.transactionDate) - new Date(a.transactionDate)
        )[0];
        
        const daysSinceLastPurchase = lastTransaction 
            ? Math.floor((Date.now() - new Date(lastTransaction.transactionDate)) / (1000 * 60 * 60 * 24))
            : 999;
        
        const purchaseFrequency = transactions.length;
        const averageOrderValue = purchaseFrequency > 0 ? totalSpent / purchaseFrequency : 0;
        const engagementScore = Math.max(0, 100 - (daysSinceLastPurchase / 2));
        
        const customerData = {
            daysSinceLastPurchase,
            purchaseFrequency,
            averageOrderValue,
            engagementScore,
            totalSpent
        };
        
        const churnScore = calculateChurnScore(customerData);
        const riskLevel = getRiskLevel(churnScore);
        const factors = generateRiskFactors(customerData, churnScore);
        const recommendations = generateRecommendations(riskLevel, customerData);
        const predictedRevenueLoss = Math.floor(totalSpent * 0.3);
        
        const prediction = {
            customerId: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            churnScore,
            riskLevel,
            lastPurchase: lastTransaction?.transactionDate || customer.createdDate,
            totalSpent,
            predictedRevenueLoss,
            factors,
            recommendations,
            ...customerData
        };
        
        res.json(prediction);
    } catch (error) {
        console.error('Error fetching customer churn prediction:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy dự đoán churn',
            error: error.message 
        });
    }
});

// API 3: Lưu/Cập nhật churn prediction vào database
router.post('/predictions/save', async (req, res) => {
    try {
        const predictions = req.body.predictions || [];
        
        for (const pred of predictions) {
            await ChurnPrediction.findOneAndUpdate(
                { customerId: pred.customerId },
                {
                    churnScore: pred.churnScore,
                    riskLevel: pred.riskLevel,
                    predictedRevenueLoss: pred.predictedRevenueLoss,
                    factors: pred.factors,
                    lastPurchaseDate: pred.lastPurchase,
                    totalSpent: pred.totalSpent,
                    purchaseFrequency: pred.purchaseFrequency,
                    averageOrderValue: pred.averageOrderValue,
                    daysSinceLastPurchase: pred.daysSinceLastPurchase,
                    engagementScore: pred.engagementScore,
                    recommendations: pred.recommendations,
                    predictedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }
        
        res.json({ 
            message: 'Đã lưu dự đoán churn thành công',
            count: predictions.length 
        });
    } catch (error) {
        console.error('Error saving churn predictions:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lưu dự đoán churn',
            error: error.message 
        });
    }
});

// API 4: Lấy thống kê tổng quan về churn
router.get('/statistics', async (req, res) => {
    try {
        const predictions = await ChurnPrediction.find({});
        
        const stats = {
            total: predictions.length,
            highRisk: predictions.filter(p => p.riskLevel === 'Cao').length,
            mediumRisk: predictions.filter(p => p.riskLevel === 'Trung bình').length,
            lowRisk: predictions.filter(p => p.riskLevel === 'Thấp').length,
            avgChurnScore: predictions.length > 0 
                ? Math.round(predictions.reduce((sum, p) => sum + p.churnScore, 0) / predictions.length)
                : 0,
            totalPredictedLoss: predictions.reduce((sum, p) => sum + (p.predictedRevenueLoss || 0), 0)
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching churn statistics:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy thống kê churn',
            error: error.message 
        });
    }
});

// API 5: Xuất báo cáo Excel (placeholder - cần implement excel export)
router.get('/export', async (req, res) => {
    try {
        // Tạm thời trả về JSON, có thể implement Excel export sau
        const predictions = await ChurnPrediction.find({})
            .populate('customerId', 'name email phone');
        
        res.json({ 
            message: 'Dữ liệu xuất Excel',
            data: predictions 
        });
    } catch (error) {
        console.error('Error exporting churn data:', error);
        res.status(500).json({ 
            message: 'Lỗi khi xuất dữ liệu',
            error: error.message 
        });
    }
});

module.exports = router;
