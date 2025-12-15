const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    try {
        // Lấy token từ header
        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({ message: "Không tìm thấy token, quyền truy cập bị từ chối" });
        }

        // Kiểm tra định dạng "Bearer [token]"
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.substring(7)
            : authHeader;

        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Thêm thông tin user vào request
        req.user = decoded;

        next();
    } catch (error) {
        console.error("Lỗi xác thực:", error.message);
        res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
}

module.exports = auth;