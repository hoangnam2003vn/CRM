// routes/customerRoutes.js
const express = require('express');
const Customer = require('../models/customer');
const router = express.Router();
const excel = require('exceljs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Thư mục tạm để lưu file upload
const fs = require('fs');
const path = require('path');

// Lấy danh sách tất cả khách hàng
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving customers' });
    }
});

// API xuất dữ liệu khách hàng ra file Excel
router.get('/export', async (req, res) => {
    try {
        // Lấy danh sách khách hàng từ database
        const customers = await Customer.find();

        // Tạo workbook mới
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách khách hàng');

        // Định nghĩa các cột
        worksheet.columns = [
            { header: 'Tên khách hàng', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Số điện thoại', key: 'phone', width: 15 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Ngày tạo', key: 'createdDate', width: 20 },
            { header: 'Công ty', key: 'company', width: 30 }
        ];

        // Thêm style cho header
        worksheet.getRow(1).font = { bold: true };

        // Thêm dữ liệu từ danh sách khách hàng
        customers.forEach(customer => {
            // Format ngày tháng
            const formattedDate = customer.createdDate ?
                new Date(customer.createdDate).toLocaleDateString('vi-VN') : '';

            worksheet.addRow({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                status: customer.status || '',
                createdDate: formattedDate,
                company: customer.company || ''
            });
        });

        // Thiết lập header cho response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=danh-sach-khach-hang.xlsx');

        // Ghi workbook vào response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Lỗi khi xuất dữ liệu khách hàng:', error);
        res.status(500).json({ message: 'Lỗi khi xuất dữ liệu khách hàng' });
    }
});

// API nhập dữ liệu khách hàng từ file Excel
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        // Kiểm tra file
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file để nhập dữ liệu' });
        }

        // Đường dẫn file tạm đã upload
        const filePath = req.file.path;

        // Lấy phần mở rộng của file
        const originalExt = path.extname(req.file.originalname).toLowerCase();

        // Kiểm tra định dạng file
        if (originalExt !== '.xlsx' && originalExt !== '.xls' && originalExt !== '.csv') {
            // Xóa file tạm nếu không phải định dạng hỗ trợ
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'Định dạng file không được hỗ trợ. Vui lòng sử dụng file Excel (.xlsx, .xls) hoặc CSV (.csv)' });
        }

        try {
            // Đọc file Excel
            const workbook = new excel.Workbook();
            await workbook.xlsx.readFile(filePath);

            // Lấy worksheet đầu tiên
            const worksheet = workbook.getWorksheet(1);

            // Kiểm tra worksheet có dữ liệu không
            if (!worksheet || worksheet.rowCount <= 1) {
                fs.unlinkSync(filePath);
                return res.status(400).json({ message: 'File không có dữ liệu hoặc không đúng định dạng' });
            }

            // Lấy header
            const headers = worksheet.getRow(1).values;

            // Mảng chứa các khách hàng sẽ được thêm vào
            const customersToAdd = [];

            // Mảng chứa lỗi nếu có
            const errors = [];

            // Duyệt qua từng dòng để lấy dữ liệu (bắt đầu từ dòng 2)
            for (let i = 2; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);

                // Lấy dữ liệu từng cột
                const customerData = {
                    name: row.getCell(getColumnIndex(headers, 'Tên khách hàng')).value || '',
                    email: row.getCell(getColumnIndex(headers, 'Email')).value || '',
                    phone: row.getCell(getColumnIndex(headers, 'Số điện thoại')).value || '',
                    status: row.getCell(getColumnIndex(headers, 'Trạng thái')).value || 'Active',
                    company: row.getCell(getColumnIndex(headers, 'Công ty')).value || '',
                    createdDate: new Date().toISOString()
                };

                // Kiểm tra dữ liệu bắt buộc
                if (!customerData.name || !customerData.email) {
                    errors.push(`Dòng ${i}: Tên và Email không được để trống`);
                    continue;
                }

                // Kiểm tra email hợp lệ
                if (!validateEmail(customerData.email)) {
                    errors.push(`Dòng ${i}: Email không hợp lệ`);
                    continue;
                }

                // Thêm vào mảng
                customersToAdd.push(customerData);
            }

            // Xóa file tạm sau khi đọc xong
            fs.unlinkSync(filePath);

            // Nếu không có dữ liệu hợp lệ
            if (customersToAdd.length === 0) {
                return res.status(400).json({
                    message: 'Không có dữ liệu hợp lệ để nhập',
                    errors
                });
            }

            // Thêm khách hàng vào database
            const addedCustomers = await Customer.insertMany(customersToAdd);

            // Trả về kết quả
            res.json({
                message: `Đã nhập ${addedCustomers.length} khách hàng thành công`,
                count: addedCustomers.length,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            // Xóa file tạm nếu có lỗi
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            console.error('Lỗi khi đọc file:', error);
            res.status(500).json({ message: 'Lỗi khi đọc file hoặc nhập dữ liệu', error: error.message });
        }
    } catch (error) {
        console.error('Lỗi khi nhập dữ liệu khách hàng:', error);
        res.status(500).json({ message: 'Lỗi khi nhập dữ liệu khách hàng', error: error.message });
    }
});

// API để tải file mẫu
router.get('/template', async (req, res) => {
    try {
        // Tạo workbook mới
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Mẫu Khách Hàng');

        // Định nghĩa các cột
        worksheet.columns = [
            { header: 'Tên khách hàng', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Số điện thoại', key: 'phone', width: 15 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Công ty', key: 'company', width: 30 }
        ];

        // Thêm style cho header
        worksheet.getRow(1).font = { bold: true };

        // Thêm một dòng mẫu dữ liệu
        worksheet.addRow({
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
            phone: '0901234567',
            status: 'Active',
            company: 'Công ty ABC'
        });

        // Thêm một dòng mẫu nữa
        worksheet.addRow({
            name: 'Trần Thị B',
            email: 'tranthib@example.com',
            phone: '0912345678',
            status: 'Active',
            company: 'Công ty XYZ'
        });

        // Thiết lập header cho response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=mau-khach-hang.xlsx');

        // Ghi workbook vào response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Lỗi khi tạo file mẫu:', error);
        res.status(500).json({ message: 'Lỗi khi tạo file mẫu' });
    }
});

// Thêm khách hàng mới (Đã thêm status, company, createdDate)
router.post('/add', async (req, res) => {
    const { name, email, phone, status, createdDate, company } = req.body;
    try {
        const newCustomer = new Customer({
            name,
            email,
            phone,
            status: status || 'Active', // Nếu không có thì mặc định là "Active"
            createdDate: createdDate || new Date().toISOString(),
            company: company || ''
        });
        await newCustomer.save();
        res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
    } catch (error) {
        res.status(500).json({ message: 'Error adding customer' });
    }
});

// GET /api/customers/:id -> Xem chi tiết 1 khách hàng
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
        }
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Cập nhật thông tin khách hàng
router.put('/update/:id', async (req, res) => {
    const { name, email, phone, status, company, createdDate } = req.body;
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        customer.name = name;
        customer.email = email;
        customer.phone = phone;
        customer.status = status || customer.status; // giữ nguyên nếu không đổi
        customer.company = company || customer.company;
        customer.createdDate = createdDate || customer.createdDate;

        await customer.save();
        res.json({ message: 'Customer updated successfully', customer });
    } catch (error) {
        res.status(500).json({ message: 'Error updating customer' });
    }
});


// Xóa khách hàng
router.delete('/delete/:id', async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting customer' });
    }
});

// Hàm tìm index của cột dựa vào header
function getColumnIndex(headers, headerName) {
    const index = headers.findIndex(h => h && h.toString().toLowerCase() === headerName.toLowerCase());
    return index !== -1 ? index : 1; // Trả về 1 nếu không tìm thấy (column A sẽ là 1 trong ExcelJS)
}

// Hàm kiểm tra email hợp lệ
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

module.exports = router;