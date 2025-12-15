// routes/opportunityRoutes.js
const express = require('express');
const router = express.Router();
const Opportunity = require('../models/opportunity');
const authMiddleware = require('../middleware/auth');

// 📋 Lấy danh sách tất cả cơ hội
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { searchText, stageFilter, startDate, endDate, assignedTo } = req.query;

        const filter = {};

        // Tìm kiếm theo text
        if (searchText) {
            filter.$or = [
                { name: { $regex: searchText, $options: 'i' } },
                { customer: { $regex: searchText, $options: 'i' } },
                { assignedTo: { $regex: searchText, $options: 'i' } }
            ];
        }

        // Lọc theo giai đoạn
        if (stageFilter && stageFilter !== 'all') {
            filter.stage = stageFilter;
        }

        // Lọc theo người phụ trách
        if (assignedTo && assignedTo !== 'all') {
            filter.assignedTo = assignedTo;
        }

        // Lọc theo khoảng thời gian dự kiến đóng
        if (startDate && endDate) {
            filter.expectedCloseDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const opportunities = await Opportunity.find(filter)
            .populate('createdBy', 'name email')
            .sort({ expectedCloseDate: 1 }); // Sắp xếp theo ngày dự kiến đóng

        res.json(opportunities);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách cơ hội:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách cơ hội',
            error: error.message
        });
    }
});

// 🔍 Lấy chi tiết một cơ hội
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!opportunity) {
            return res.status(404).json({ message: 'Không tìm thấy cơ hội' });
        }

        res.json(opportunity);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết cơ hội:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy chi tiết cơ hội',
            error: error.message
        });
    }
});

// 📥 Thêm cơ hội mới
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { name, customer, value, stage, probability, expectedCloseDate, assignedTo, description, notes } = req.body;

        // Validation
        if (!name || !customer || !value || !expectedCloseDate || !assignedTo) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc: tên cơ hội, khách hàng, giá trị, ngày dự kiến đóng, và người phụ trách'
            });
        }

        if (value < 0) {
            return res.status(400).json({
                message: 'Giá trị cơ hội phải >= 0'
            });
        }

        if (probability < 0 || probability > 100) {
            return res.status(400).json({
                message: 'Xác suất phải từ 0-100%'
            });
        }

        const opportunity = new Opportunity({
            name,
            customer,
            value: Number(value),
            stage: stage || 'Khám phá',
            probability: Number(probability) || 10,
            expectedCloseDate: new Date(expectedCloseDate),
            assignedTo,
            description,
            notes,
            createdBy: req.user.userId
        });

        await opportunity.save();

        // Populate thông tin user trước khi trả về
        await opportunity.populate('createdBy', 'name email');

        res.status(201).json({
            message: 'Thêm cơ hội thành công',
            opportunity
        });
    } catch (error) {
        console.error("Lỗi tạo cơ hội:", error);
        res.status(500).json({
            message: "Lỗi tạo cơ hội",
            error: error.message
        });
    }
});

// ✏️ Cập nhật cơ hội
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { name, customer, value, stage, probability, expectedCloseDate, assignedTo, description, notes } = req.body;

        const opportunity = await Opportunity.findById(req.params.id);
        if (!opportunity) {
            return res.status(404).json({ message: 'Không tìm thấy cơ hội' });
        }

        // Validation
        if (value !== undefined && value < 0) {
            return res.status(400).json({ message: 'Giá trị cơ hội phải >= 0' });
        }

        if (probability !== undefined && (probability < 0 || probability > 100)) {
            return res.status(400).json({ message: 'Xác suất phải từ 0-100%' });
        }

        // Cập nhật các trường
        if (name) opportunity.name = name;
        if (customer) opportunity.customer = customer;
        if (value !== undefined) opportunity.value = Number(value);
        if (stage) opportunity.stage = stage;
        if (probability !== undefined) opportunity.probability = Number(probability);
        if (expectedCloseDate) opportunity.expectedCloseDate = new Date(expectedCloseDate);
        if (assignedTo) opportunity.assignedTo = assignedTo;
        if (description !== undefined) opportunity.description = description;
        if (notes !== undefined) opportunity.notes = notes;

        await opportunity.save();
        await opportunity.populate('createdBy', 'name email');

        res.json({
            message: 'Cập nhật cơ hội thành công',
            opportunity
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật cơ hội:", error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật cơ hội',
            error: error.message
        });
    }
});

// 🗑️ Xóa cơ hội
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id);
        if (!opportunity) {
            return res.status(404).json({ message: 'Không tìm thấy cơ hội' });
        }

        await Opportunity.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa cơ hội thành công' });
    } catch (error) {
        console.error("Lỗi khi xóa cơ hội:", error);
        res.status(500).json({
            message: 'Lỗi khi xóa cơ hội',
            error: error.message
        });
    }
});

// 📊 Lấy thống kê cơ hội
router.get('/stats/summary', authMiddleware, async (req, res) => {
    try {
        const totalOpportunities = await Opportunity.countDocuments();
        const totalValue = await Opportunity.aggregate([
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);

        const wonOpportunities = await Opportunity.countDocuments({ stage: 'Đã đóng (Thắng)' });
        const wonValue = await Opportunity.aggregate([
            { $match: { stage: 'Đã đóng (Thắng)' } },
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);

        // Thống kê theo giai đoạn
        const opportunitiesByStage = await Opportunity.aggregate([
            {
                $group: {
                    _id: '$stage',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$value' }
                }
            }
        ]);

        // Pipeline có trọng số
        const weightedValue = await Opportunity.aggregate([
            {
                $project: {
                    weightedValue: { $multiply: ['$value', { $divide: ['$probability', 100] }] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$weightedValue' }
                }
            }
        ]);

        res.json({
            total: totalOpportunities,
            totalValue: totalValue[0]?.total || 0,
            won: wonOpportunities,
            wonValue: wonValue[0]?.total || 0,
            weightedValue: weightedValue[0]?.total || 0,
            byStage: opportunitiesByStage
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê cơ hội:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy thống kê cơ hội',
            error: error.message
        });
    }
});

module.exports = router;