const mongoose = require("mongoose");

// Schema cho Digital Twin của khách hàng
const CustomerTwinSchema = new mongoose.Schema({
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true,
        unique: true
    },
    
    // Thông tin cơ bản
    basicInfo: {
        segment: { 
            type: String, 
            enum: ['VIP', 'Premium', 'Regular', 'New'],
            default: 'Regular'
        },
        lifetimeValue: { type: Number, default: 0 },
        loyaltyPoints: { type: Number, default: 0 },
        preferredChannel: String,
        joinDate: Date
    },

    // Hành vi mua hàng
    purchaseBehavior: {
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        lastPurchaseDate: Date,
        purchaseFrequency: { type: Number, default: 0 },
        favoriteCategories: [String],
        favoriteProducts: [{
            productId: String,
            productName: String,
            purchaseCount: Number
        }]
    },

    // Điểm số và đánh giá
    scores: {
        satisfactionScore: { type: Number, default: 0, min: 0, max: 100 },
        engagementScore: { type: Number, default: 0, min: 0, max: 100 },
        churnRisk: { type: Number, default: 0, min: 0, max: 100 },
        loyaltyScore: { type: Number, default: 0, min: 0, max: 100 }
    },

    // Mẫu hành vi (Behavioral Pattern)
    behavioralPattern: {
        purchaseTimePatterns: [{
            dayOfWeek: String,
            hourOfDay: Number,
            frequency: Number
        }],
        seasonalTrends: [{
            month: Number,
            avgSpending: Number
        }],
        interactionChannels: [{
            channel: String,
            usagePercentage: Number,
            satisfaction: Number
        }]
    },

    // Dự đoán và insights
    predictions: {
        nextPurchaseDate: Date,
        nextPurchaseProbability: { type: Number, default: 0, min: 0, max: 100 },
        recommendedProducts: [String],
        estimatedNextOrderValue: { type: Number, default: 0 },
        churnProbability: { type: Number, default: 0, min: 0, max: 100 }
    },

    // Tương tác và hoạt động
    interactions: [{
        date: Date,
        type: { 
            type: String, 
            enum: ['Mua hàng', 'Đánh giá', 'Hỗ trợ', 'Marketing', 'Email', 'Khác']
        },
        detail: String,
        value: Number,
        sentiment: String
    }],

    // Khuyến nghị AI
    recommendations: [{
        action: String,
        priority: { 
            type: String, 
            enum: ['low', 'medium', 'high']
        },
        impact: { type: Number, min: 0, max: 100 },
        reason: String,
        createdAt: { type: Date, default: Date.now }
    }],

    // Metadata
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    },
    dataQuality: { 
        type: Number, 
        default: 50,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Indexes
CustomerTwinSchema.index({ customerId: 1 });
CustomerTwinSchema.index({ 'basicInfo.segment': 1 });
CustomerTwinSchema.index({ 'scores.churnRisk': -1 });
CustomerTwinSchema.index({ 'predictions.nextPurchaseProbability': -1 });

// Method để tính toán lifetime value
CustomerTwinSchema.methods.calculateLifetimeValue = function() {
    return this.purchaseBehavior.totalSpent * 1.5; // Ước tính future value
};

// Method để cập nhật behavioral pattern
CustomerTwinSchema.methods.updateBehavioralPattern = function(newPurchase) {
    // Logic cập nhật pattern dựa trên giao dịch mới
    this.lastUpdated = Date.now();
};

const CustomerTwin = mongoose.model("CustomerTwin", CustomerTwinSchema);
module.exports = CustomerTwin;
