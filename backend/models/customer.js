const mongoose = require("mongoose");

// Định nghĩa Schema
const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    status: { type: String, default: 'Active' },
    createdDate: { type: Date, default: Date.now },
    company: { type: String, default: '' }
});

// Xuất model
const Customer = mongoose.model("Customer", CustomerSchema);
module.exports = Customer;


