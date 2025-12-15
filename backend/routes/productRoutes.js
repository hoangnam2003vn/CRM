// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');
const ExcelJS = require('exceljs');

// 📋 Lấy danh sách tất cả sản phẩm
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { searchText, category, status, supplier, minPrice, maxPrice } = req.query;

        const filter = {};

        // Tìm kiếm theo text
        if (searchText) {
            filter.$or = [
                { name: { $regex: searchText, $options: 'i' } },
                { sku: { $regex: searchText, $options: 'i' } },
                { supplier: { $regex: searchText, $options: 'i' } }
            ];
        }

        // Lọc theo danh mục
        if (category && category !== 'all') {
            filter.category = category;
        }

        // Lọc theo trạng thái
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Lọc theo nhà cung cấp
        if (supplier && supplier !== 'all') {
            filter.supplier = supplier;
        }

        // Lọc theo khoảng giá
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách sản phẩm',
            error: error.message
        });
    }
});

// 🔍 Lấy chi tiết một sản phẩm
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        res.json(product);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy chi tiết sản phẩm',
            error: error.message
        });
    }
});

// 📥 Thêm sản phẩm mới
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { name, sku, price, category, stock, status, supplier, description } = req.body;

        // Validation
        if (!name || !sku || !price || !category || !supplier) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc: tên sản phẩm, SKU, giá bán, danh mục, và nhà cung cấp'
            });
        }

        if (price < 0) {
            return res.status(400).json({
                message: 'Giá sản phẩm phải >= 0'
            });
        }

        if (stock < 0) {
            return res.status(400).json({
                message: 'Số lượng tồn kho phải >= 0'
            });
        }

        // Kiểm tra SKU đã tồn tại chưa
        const existingSku = await Product.findOne({ sku });
        if (existingSku) {
            return res.status(400).json({ message: 'Mã SKU đã tồn tại' });
        }

        const product = new Product({
            name,
            sku,
            price: Number(price),
            category,
            stock: Number(stock) || 0,
            status: status || 'Hoạt động',
            supplier,
            description,
            createdBy: req.user.userId
        });

        await product.save();

        // Populate thông tin user trước khi trả về
        await product.populate('createdBy', 'name email');

        res.status(201).json({
            message: 'Thêm sản phẩm thành công',
            product
        });
    } catch (error) {
        console.error("Lỗi tạo sản phẩm:", error);
        res.status(500).json({
            message: "Lỗi tạo sản phẩm",
            error: error.message
        });
    }
});

// ✏️ Cập nhật sản phẩm
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { name, sku, price, category, stock, status, supplier, description } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // Validation
        if (price !== undefined && price < 0) {
            return res.status(400).json({ message: 'Giá sản phẩm phải >= 0' });
        }

        if (stock !== undefined && stock < 0) {
            return res.status(400).json({ message: 'Số lượng tồn kho phải >= 0' });
        }

        // Kiểm tra SKU trùng (nếu thay đổi SKU)
        if (sku && sku !== product.sku) {
            const existingSku = await Product.findOne({ sku });
            if (existingSku) {
                return res.status(400).json({ message: 'Mã SKU đã tồn tại' });
            }
        }

        // Cập nhật các trường
        if (name) product.name = name;
        if (sku) product.sku = sku;
        if (price !== undefined) product.price = Number(price);
        if (category) product.category = category;
        if (stock !== undefined) product.stock = Number(stock);
        if (status) product.status = status;
        if (supplier) product.supplier = supplier;
        if (description !== undefined) product.description = description;

        await product.save();
        await product.populate('createdBy', 'name email');

        res.json({
            message: 'Cập nhật sản phẩm thành công',
            product
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật sản phẩm',
            error: error.message
        });
    }
});

// 🗑️ Xóa sản phẩm
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        res.status(500).json({
            message: 'Lỗi khi xóa sản phẩm',
            error: error.message
        });
    }
});

// 📊 Lấy thống kê sản phẩm
router.get('/stats/summary', authMiddleware, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        
        // Tổng giá trị tất cả sản phẩm (giá * số lượng)
        const totalValue = await Product.aggregate([
            { $project: { totalValue: { $multiply: ['$price', '$stock'] } } },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);

        // Sản phẩm đang hoạt động
        const activeProducts = await Product.countDocuments({ status: 'Hoạt động' });
        const activeValue = await Product.aggregate([
            { $match: { status: 'Hoạt động' } },
            { $project: { totalValue: { $multiply: ['$price', '$stock'] } } },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);

        // Sản phẩm ngừng kinh doanh
        const inactiveProducts = await Product.countDocuments({ status: 'Ngừng bán' });
        const inactiveValue = await Product.aggregate([
            { $match: { status: 'Ngừng bán' } },
            { $project: { totalValue: { $multiply: ['$price', '$stock'] } } },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);

        // Thống kê theo danh mục
        const productsByCategory = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
                }
            }
        ]);

        res.json({
            total: totalProducts,
            totalValue: totalValue[0]?.total || 0,
            active: activeProducts,
            activeValue: activeValue[0]?.total || 0,
            inactive: inactiveProducts,
            inactiveValue: inactiveValue[0]?.total || 0,
            byCategory: productsByCategory
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê sản phẩm:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy thống kê sản phẩm',
            error: error.message
        });
    }
});

// 📊 Xuất Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find().populate('createdBy', 'name');
        
        // Tạo workbook và worksheet mới
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách sản phẩm');
        
        // Định dạng header
        worksheet.columns = [
            { header: 'SKU', key: 'sku', width: 15 },
            { header: 'Tên sản phẩm', key: 'name', width: 30 },
            { header: 'Danh mục', key: 'category', width: 15 },
            { header: 'Giá bán', key: 'price', width: 15, style: { numFmt: '#,##0 ₫' } },
            { header: 'Tồn kho', key: 'stock', width: 10 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Nhà cung cấp', key: 'supplier', width: 20 },
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
        products.forEach(product => {
            worksheet.addRow({
                sku: product.sku,
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                status: product.status,
                supplier: product.supplier,
                createdBy: product.createdBy?.name || '',
                createdAt: new Date(product.createdAt).toLocaleDateString('vi-VN')
            });
        });
        
        // Thiết lập header để tải file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=danh-sach-san-pham.xlsx');
        
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

// 📋 Lấy danh sách tất cả danh mục
router.get('/categories/list', authMiddleware, async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách danh mục:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách danh mục',
            error: error.message
        });
    }
});

// 📋 Lấy danh sách tất cả nhà cung cấp
router.get('/suppliers/list', authMiddleware, async (req, res) => {
    try {
        const suppliers = await Product.distinct('supplier');
        res.json(suppliers);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nhà cung cấp:", error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách nhà cung cấp',
            error: error.message
        });
    }
});

module.exports = router;