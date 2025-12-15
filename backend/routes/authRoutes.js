const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const router = express.Router();

// API ĐĂNG KÝ
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// API ĐĂNG NHẬP
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Sai email hoặc mật khẩu" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Sai email hoặc mật khẩu" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// API QUÊN MẬT KHẨU – gửi mã reset qua email
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Không tìm thấy user với email này" });
        }

        const resetToken = Math.random().toString(36).substring(2, 10);
        user.resetToken = resetToken;
        await user.save();

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Mã reset mật khẩu",
            text: `Mã reset mật khẩu của bạn là: ${resetToken}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Lỗi gửi email: ", error);
                return res.status(500).json({ error: "Lỗi gửi email" });
            } else {
                console.log("Email đã được gửi: " + info.response);
                res.json({ message: "Mã đặt lại mật khẩu đã được gửi qua email." });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// ✅ API ĐẶT LẠI MẬT KHẨU từ resetToken
router.post("/reset-password", async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        const user = await User.findOne({ email, resetToken });
        if (!user) {
            return res.status(400).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = null;
        await user.save();

        res.json({ message: "Đặt lại mật khẩu thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server khi đặt lại mật khẩu" });
    }
});

module.exports = router;
