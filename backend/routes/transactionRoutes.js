const express = require('express');
const router = express.Router();
const excel = require('exceljs');
const Transaction = require('../models/transaction');
const authMiddleware = require('../middleware/auth');

// 📥 Thêm giao dịch mới
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      createdBy: req.user.userId
    });
    await transaction.save();
    res.status(201).json({ message: 'Thêm giao dịch thành công', transaction });
  } catch (error) {
    console.error("Lỗi tạo giao dịch:", error.message); // Ghi chi tiết lỗi ra console
    res.status(500).json({ message: "Lỗi tạo giao dịch", error: error.message });
  }
});

// 📋 Lấy danh sách giao dịch
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { searchText, statusFilter, startDate, endDate } = req.query;

    const filter = {};

    if (searchText) {
      filter.$or = [
        { customer: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } }
      ];
    }

    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter;
    }

    if (startDate && endDate) {
      filter.transactionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(filter)
      .populate('customer')
      .populate('createdBy');

    res.json(transactions);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách giao dịch:", error); // 👈 nên thêm log lỗi
    res.status(500).json({ message: 'Lỗi khi lấy danh sách giao dịch', error });
  }
});

// API xuất dữ liệu giao dịch ra file Excel
router.get('/export', authMiddleware, async (req, res) => {
  try {
    console.log('Bắt đầu xử lý export Excel');

    // Lấy danh sách giao dịch từ database
    const transactions = await Transaction.find()
      .sort({ transactionDate: -1 });

    console.log(`Đã tìm thấy ${transactions.length} giao dịch để xuất`);

    // Tạo workbook mới
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách giao dịch');

    // Định nghĩa các cột
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Khách hàng', key: 'customer', width: 25 },
      { header: 'Số tiền', key: 'amount', width: 15 },
      { header: 'Loại', key: 'type', width: 10 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Ngày giao dịch', key: 'date', width: 20 },
      { header: 'Phương thức thanh toán', key: 'paymentMethod', width: 20 },
      { header: 'Mô tả', key: 'description', width: 40 }
    ];

    // Thêm style cho header
    worksheet.getRow(1).font = { bold: true };

    // Thêm dữ liệu từ danh sách giao dịch
    transactions.forEach(transaction => {
      // Format ngày tháng
      const formattedDate = transaction.transactionDate ?
        new Date(transaction.transactionDate).toLocaleDateString('vi-VN') : '';

      worksheet.addRow({
        id: transaction._id.toString(),
        customer: transaction.customer || '',
        amount: transaction.amount || 0,
        type: transaction.transactionType === 'thu' ? 'Thu' : 'Chi',
        status: transaction.status || '',
        date: formattedDate,
        paymentMethod: transaction.paymentMethod || '',
        description: transaction.description || ''
      });
    });

    // Format cột số tiền thành tiền tệ
    worksheet.getColumn('amount').numFmt = '#,##0 ₫';

    // Thiết lập header cho response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=danh-sach-giao-dich.xlsx');

    console.log('Bắt đầu ghi workbook vào response');

    // Ghi workbook vào response
    await workbook.xlsx.write(res);

    console.log('Đã ghi xong workbook vào response');

    res.end();
  } catch (error) {
    console.error('Lỗi khi xuất dữ liệu giao dịch:', error);
    res.status(500).json({ message: 'Lỗi khi xuất dữ liệu giao dịch', error: error.message });
  }
});

// 🔍 Lấy chi tiết một giao dịch 
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('customer').populate('createdBy');
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết giao dịch', error });
  }
});

// ✏️ Cập nhật giao dịch
router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Cập nhật giao dịch thành công', transaction: updated });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật giao dịch', error });
  }
});

// 🗑️ Xoá giao dịch
router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xoá giao dịch thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá giao dịch', error });
  }
});

module.exports = router;