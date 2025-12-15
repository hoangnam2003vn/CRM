// routes/contractRoutes.js
const express = require('express');
const router = express.Router();
const Contract = require('../models/contract');
const authMiddleware = require('../middleware/auth');
const ExcelJS = require('exceljs');

// 📋 Lấy danh sách tất cả hợp đồng
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { searchText, type, status, priority, minValue, maxValue } = req.query;

        const filter = {};

        // Tìm kiếm theo text
        if (searchText) {
            filter.$or = [
                { title: { $regex: searchText, $options: 'i' } },
                { contractNumber: { $regex: searchText, $options: 'i' } },
                { clientName: { $regex: searchText, $options: 'i' } },
                { clientEmail: { $regex: searchText, $options: 'i' } }
            ];
        }

        // Lọc theo loại hợp đồng
        if (type && type !== 'Tất cả') {
            filter.type = type;
        }

        // Lọc theo trạng thái
        if (status && status !== 'Tất cả') {
            filter.status = status;
        }

        // Lọc theo độ ưu tiên
        if (priority && priority !== 'Tất cả') {
            filter.priority = priority;
        }

        // Lọc theo khoảng giá trị
        if (minValue || maxValue) {
            filter.value = {};
            if (minValue) filter.value.$gte = Number(minValue);
            if (maxValue) filter.value.$lte = Number(maxValue);
        }

        const contracts = await Contract.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(contracts);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hợp đồng:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách hợp đồng',
            error: error.message
        });
    }
});

// 📊 Lấy thống kê hợp đồng (PHẢI đặt trước /:id)
router.get('/stats/summary', authMiddleware, async (req, res) => {
    try {
        const totalContracts = await Contract.countDocuments();
        
        // Tổng giá trị tất cả hợp đồng
        const totalValue = await Contract.aggregate([
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);

        // Hợp đồng theo trạng thái
        const activeContracts = await Contract.countDocuments({ status: 'Active' });
        const pendingContracts = await Contract.countDocuments({ status: 'Pending' });
        const completedContracts = await Contract.countDocuments({ status: 'Completed' });

        // Thống kê theo loại hợp đồng
        const contractsByType = await Contract.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$value' }
                }
            }
        ]);

        res.json({
            total: totalContracts,
            totalValue: totalValue[0]?.total || 0,
            active: activeContracts,
            pending: pendingContracts,
            completed: completedContracts,
            byType: contractsByType
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê hợp đồng:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy thống kê hợp đồng',
            error: error.message
        });
    }
});

// 🔍 Lấy chi tiết một hợp đồng
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
        }

        res.json(contract);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết hợp đồng:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy chi tiết hợp đồng',
            error: error.message
        });
    }
});

// 📥 Thêm hợp đồng mới
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const {
            title, contractNumber, clientName, clientEmail, type, value,
            startDate, endDate, signedDate, status, progress, priority, description
        } = req.body;

        // Validation
        if (!title || !contractNumber || !clientName || !value || !startDate || !endDate) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc: tiêu đề, số hợp đồng, tên khách hàng, giá trị, ngày bắt đầu và ngày kết thúc'
            });
        }

        if (value < 0) {
            return res.status(400).json({
                message: 'Giá trị hợp đồng phải >= 0'
            });
        }

        // Kiểm tra số hợp đồng đã tồn tại chưa
        const existingContract = await Contract.findOne({ contractNumber });
        if (existingContract) {
            return res.status(400).json({ message: 'Số hợp đồng đã tồn tại' });
        }

        const contract = new Contract({
            title,
            contractNumber,
            clientName,
            clientEmail,
            type,
            value: Number(value),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            signedDate: signedDate ? new Date(signedDate) : undefined,
            status,
            progress: Number(progress) || 0,
            priority,
            description,
            createdBy: req.user.userId
        });

        await contract.save();

        // Populate thông tin user trước khi trả về
        await contract.populate('createdBy', 'name email');

        res.status(201).json({
            message: 'Thêm hợp đồng thành công',
            contract
        });
    } catch (error) {
        console.error("Lỗi tạo hợp đồng:", error);
        res.status(500).json({
            message: "Lỗi tạo hợp đồng",
            error: error.message
        });
    }
});

// ✏️ Cập nhật hợp đồng
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const {
            title, contractNumber, clientName, clientEmail, type, value,
            startDate, endDate, signedDate, status, progress, priority, description
        } = req.body;

        const contract = await Contract.findById(req.params.id);
        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
        }

        // Validation
        if (value !== undefined && value < 0) {
            return res.status(400).json({ message: 'Giá trị hợp đồng phải >= 0' });
        }

        // Kiểm tra số hợp đồng trùng (nếu thay đổi số hợp đồng)
        if (contractNumber && contractNumber !== contract.contractNumber) {
            const existingContract = await Contract.findOne({ contractNumber });
            if (existingContract) {
                return res.status(400).json({ message: 'Số hợp đồng đã tồn tại' });
            }
        }

        // Cập nhật các trường
        if (title) contract.title = title;
        if (contractNumber) contract.contractNumber = contractNumber;
        if (clientName) contract.clientName = clientName;
        if (clientEmail) contract.clientEmail = clientEmail;
        if (type) contract.type = type;
        if (value !== undefined) contract.value = Number(value);
        if (startDate) contract.startDate = new Date(startDate);
        if (endDate) contract.endDate = new Date(endDate);
        if (signedDate) contract.signedDate = new Date(signedDate);
        if (status) contract.status = status;
        if (progress !== undefined) contract.progress = Number(progress);
        if (priority) contract.priority = priority;
        if (description !== undefined) contract.description = description;

        await contract.save();
        await contract.populate('createdBy', 'name email');

        res.json({
            message: 'Cập nhật hợp đồng thành công',
            contract
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật hợp đồng:", error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật hợp đồng',
            error: error.message
        });
    }
});

// 🗑️ Xóa hợp đồng
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
        }

        await Contract.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa hợp đồng thành công' });
    } catch (error) {
        console.error("Lỗi khi xóa hợp đồng:", error);
        res.status(500).json({
            message: 'Lỗi khi xóa hợp đồng',
            error: error.message
        });
    }
});

// 📊 Xuất Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
    try {
        const contracts = await Contract.find().populate('createdBy', 'name');
        
        // Tạo workbook và worksheet mới
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách hợp đồng');
        
        // Định dạng header
        worksheet.columns = [
            { header: 'Số hợp đồng', key: 'contractNumber', width: 15 },
            { header: 'Tiêu đề', key: 'title', width: 30 },
            { header: 'Khách hàng', key: 'clientName', width: 20 },
            { header: 'Loại', key: 'type', width: 15 },
            { header: 'Giá trị', key: 'value', width: 15, style: { numFmt: '#,##0 ₫' } },
            { header: 'Ngày bắt đầu', key: 'startDate', width: 15 },
            { header: 'Ngày kết thúc', key: 'endDate', width: 15 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Tiến độ', key: 'progress', width: 10 },
            { header: 'Độ ưu tiên', key: 'priority', width: 15 },
            { header: 'Người tạo', key: 'createdBy', width: 20 },
            { header: 'Ngày tạo', key: 'createdAt', width: 15 }
        ];
        
        // Style cho header
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
        });
        
        // Thêm dữ liệu
        contracts.forEach(contract => {
            worksheet.addRow({
                contractNumber: contract.contractNumber,
                title: contract.title,
                clientName: contract.clientName,
                type: contract.type,
                value: contract.value,
                startDate: new Date(contract.startDate).toLocaleDateString('vi-VN'),
                endDate: new Date(contract.endDate).toLocaleDateString('vi-VN'),
                status: contract.status,
                progress: `${contract.progress}%`,
                priority: contract.priority,
                createdBy: contract.createdBy?.name || '',
                createdAt: new Date(contract.createdAt).toLocaleDateString('vi-VN')
            });
        });
        
        // Thiết lập header để tải file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=danh-sach-hop-dong.xlsx');
        
        // Ghi file và trả về response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Lỗi khi xuất Excel:", error);
        res.status(500).json({
            message: 'Lỗi khi xuất Excel',
            error: error.message
        });
    }
});

module.exports = router;