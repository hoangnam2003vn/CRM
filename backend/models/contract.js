const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    contractNumber: {
        type: String,
        required: true,
        unique: true
    },
    clientName: {
        type: String,
        required: true
    },
    clientEmail: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Service', 'Product', 'Consulting', 'Maintenance', 'Other'],
        default: 'Service'
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    signedDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Active', 'Completed', 'Cancelled'],
        default: 'Draft'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    description: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    documents: [{
        name: String,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("Contract", ContractSchema);