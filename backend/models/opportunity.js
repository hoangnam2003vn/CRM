// models/opportunity.js
const mongoose = require("mongoose");

const OpportunitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    customer: {
        type: String, // Tên khách hàng
        required: true
    },
    value: {
        type: Number, // Giá trị (VND)
        required: true,
        min: 0
    },
    stage: {
        type: String,
        enum: ['Khám phá', 'Đủ điều kiện', 'Đề xuất', 'Đàm phán', 'Đã đóng (Thắng)', 'Đã đóng (Thua)'],
        default: 'Khám phá'
    },
    probability: {
        type: Number, // Xác suất (%)
        required: true,
        min: 0,
        max: 100,
        default: 10
    },
    expectedCloseDate: {
        type: Date,
        required: true
    },
    assignedTo: {
        type: String, // Người phụ trách
        required: true
    },
    description: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Opportunity", OpportunitySchema);