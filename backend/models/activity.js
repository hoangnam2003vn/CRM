const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Gọi điện', 'Họp', 'Email', 'Demo', 'Theo dõi'],
        required: true,
        default: 'Gọi điện'
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    relatedTo: {
        type: String, // Tên khách hàng hoặc cơ hội
        required: true
    },
    assignedTo: {
        type: String, // Tên người phụ trách
        required: true
    },
    status: {
        type: String,
        enum: ['Đang chờ', 'Đã lên lịch', 'Hoàn thành', 'Hủy'],
        default: 'Đang chờ'
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

module.exports = mongoose.model("Activity", ActivitySchema);