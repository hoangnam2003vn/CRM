const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: __dirname + '/.env' });

const app = express();
app.use(express.json());
app.use(cors());

console.log("🚀 Server script starting...");

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Middleware xác thực
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ message: "Không tìm thấy token" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token invalid:", error.message);
    res.status(401).json({ message: "Token không hợp lệ" });
  }
}

// Middleware xác thực linh hoạt (cho phép demo mode)
function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.header("Authorization");
    if (authHeader) {
      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } else {
      // Demo mode - không có token thì vẫn cho qua
      req.user = { id: 'demo-user-id', name: 'Demo User' };
    }
    next();
  } catch (error) {
    // Token không hợp lệ vẫn cho qua với demo user
    req.user = { id: 'demo-user-id', name: 'Demo User' };
    next();
  }
}

// Import routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const analyticsRoutes = require('./routes/analyticsRoutes');
const activityRoutes = require('./routes/activityRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const productRoutes = require('./routes/productRoutes');
const contractRoutes = require('./routes/contractRoutes');
const churnRoutes = require('./routes/churnRoutes');
const copilotRoutes = require('./routes/copilotRoutes');
const digitalTwinRoutes = require('./routes/digitalTwinRoutes');

// Các API routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", authMiddleware, customerRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/activities', authMiddleware, activityRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/contracts', authMiddleware, contractRoutes);
app.use('/api/churn', optionalAuthMiddleware, churnRoutes);
app.use('/api/copilot', optionalAuthMiddleware, copilotRoutes);
app.use('/api/digital-twin', optionalAuthMiddleware, digitalTwinRoutes);
// React frontend
app.use(express.static(path.join(__dirname, 'public')));

// Trả về index.html cho các route khác
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API không tồn tại' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));