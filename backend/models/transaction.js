// models/transaction.js
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    customer: {
        type: String, 
        required: true
    },
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    transactionType: {
        type: String,
        enum: ['thu', 'chi'],
        required: true
    },
    description: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Đã hoàn thành', 'Đang xử lý', 'Hủy'], // Sửa enum để khớp với frontend
        default: 'Đang xử lý'
    },
    paymentMethod: {
        type: String,
        enum: ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng', 'Khác'],
        required: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", TransactionSchema);