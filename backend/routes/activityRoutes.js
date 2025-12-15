// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const authMiddleware = require('../middleware/auth');

// 📋 Lấy danh sách tất cả hoạt động
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { searchText, statusFilter, startDate, endDate, typeFilter } = req.query;

        const filter = {};

        // Tìm kiếm theo text
        if (searchText) {
            filter.$or = [
                { description: { $regex: searchText, $options: 'i' } },
                { relatedTo: { $regex: searchText, $options: 'i' } },
                { assignedTo: { $regex: searchText, $options: 'i' } }
            ];
        }

        // Lọc theo trạng thái
        if (statusFilter && statusFilter !== 'all') {
            filter.status = statusFilter;
        }

        // Lọc theo loại hoạt động
        if (typeFilter && typeFilter !== 'all') {
            filter.type = typeFilter;
        }

        // Lọc theo khoảng thời gian
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const activities = await Activity.find(filter)
            .populate('createdBy', 'name email')
            .sort({ date: -1 }); // Sắp xếp theo ngày mới nhất

        res.json(activities);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hoạt động:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách hoạt động',
            error: error.message
        });
    }
});

// 🔍 Lấy chi tiết một hoạt động
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!activity) {
            return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
        }

        res.json(activity);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết hoạt động:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy chi tiết hoạt động',
            error: error.message
        });
    }
});

// 📥 Thêm hoạt động mới
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { type, description, date, relatedTo, assignedTo, status, notes } = req.body;

        // Validation
        if (!description || !relatedTo || !assignedTo) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ thông tin: mô tả, liên quan đến, và người phụ trách'
            });
        }

        const activity = new Activity({
            type: type || 'Gọi điện',
            description,
            date: date || new Date(),
            relatedTo,
            assignedTo,
            status: status || 'Đang chờ',
            notes,
            createdBy: req.user.userId
        });

        await activity.save();

        // Populate thông tin user trước khi trả về
        await activity.populate('createdBy', 'name email');

        res.status(201).json({
            message: 'Thêm hoạt động thành công',
            activity
        });
    } catch (error) {
        console.error("Lỗi tạo hoạt động:", error);
        res.status(500).json({
            message: "Lỗi tạo hoạt động",
            error: error.message
        });
    }
});

// ✏️ Cập nhật hoạt động
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { type, description, date, relatedTo, assignedTo, status, notes } = req.body;

        const activity = await Activity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
        }

        // Cập nhật các trường
        if (type) activity.type = type;
        if (description) activity.description = description;
        if (date) activity.date = date;
        if (relatedTo) activity.relatedTo = relatedTo;
        if (assignedTo) activity.assignedTo = assignedTo;
        if (status) activity.status = status;
        if (notes !== undefined) activity.notes = notes;

        await activity.save();
        await activity.populate('createdBy', 'name email');

        res.json({
            message: 'Cập nhật hoạt động thành công',
            activity
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật hoạt động:", error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật hoạt động',
            error: error.message
        });
    }
});

// 🗑️ Xóa hoạt động
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
        }

        await Activity.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa hoạt động thành công' });
    } catch (error) {
        console.error("Lỗi khi xóa hoạt động:", error);
        res.status(500).json({
            message: 'Lỗi khi xóa hoạt động',
            error: error.message
        });
    }
});

// 📊 Lấy thống kê hoạt động
router.get('/stats/summary', authMiddleware, async (req, res) => {
    try {
        const totalActivities = await Activity.countDocuments();
        const completedActivities = await Activity.countDocuments({ status: 'Hoàn thành' });
        const pendingActivities = await Activity.countDocuments({ status: 'Đang chờ' });
        const scheduledActivities = await Activity.countDocuments({ status: 'Đã lên lịch' });

        // Thống kê theo loại hoạt động
        const activitiesByType = await Activity.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Activities trong tuần này
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const thisWeekActivities = await Activity.countDocuments({
            date: { $gte: weekAgo }
        });

        res.json({
            total: totalActivities,
            completed: completedActivities,
            pending: pendingActivities,
            scheduled: scheduledActivities,
            thisWeek: thisWeekActivities,
            byType: activitiesByType
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê hoạt động:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy thống kê hoạt động',
            error: error.message
        });
    }
});

module.exports = router;