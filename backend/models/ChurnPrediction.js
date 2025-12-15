const mongoose = require("mongoose");

// Schema cho dự đoán churn khách hàng
const ChurnPredictionSchema = new mongoose.Schema({
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    churnScore: { 
        type: Number, 
        required: true,
        min: 0,
        max: 100
    },
    riskLevel: { 
        type: String, 
        enum: ['Thấp', 'Trung bình', 'Cao'],
        required: true 
    },
    predictedRevenueLoss: { 
        type: Number, 
        default: 0 
    },
    factors: [{ 
        type: String 
    }],
    lastPurchaseDate: { 
        type: Date 
    },
    totalSpent: { 
        type: Number, 
        default: 0 
    },
    purchaseFrequency: { 
        type: Number, 
        default: 0 
    },
    averageOrderValue: { 
        type: Number, 
        default: 0 
    },
    daysSinceLastPurchase: { 
        type: Number, 
        default: 0 
    },
    engagementScore: { 
        type: Number, 
        default: 50,
        min: 0,
        max: 100
    },
    predictedAt: { 
        type: Date, 
        default: Date.now 
    },
    recommendations: [{
        action: String,
        priority: String,
        estimatedImpact: Number
    }]
}, {
    timestamps: true
});

// Index để tìm kiếm nhanh
ChurnPredictionSchema.index({ customerId: 1 });
ChurnPredictionSchema.index({ riskLevel: 1 });
ChurnPredictionSchema.index({ churnScore: -1 });

const ChurnPrediction = mongoose.model("ChurnPrediction", ChurnPredictionSchema);
module.exports = ChurnPrediction;
