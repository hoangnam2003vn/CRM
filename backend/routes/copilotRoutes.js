const express = require('express');
const router = express.Router();
const https = require('https');
const ChatHistory = require('../models/ChatHistory');
const Customer = require('../models/customer');
const Transaction = require('../models/transaction');

// Google Gemini API configuration
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Helper: Gọi Google Gemini API sử dụng https module
async function callGeminiAPI(prompt, crmContext) {
    return new Promise((resolve) => {
        try {
            if (!GOOGLE_AI_API_KEY) {
                console.log('No Google AI API key configured');
                resolve(null);
                return;
            }

            const systemPrompt = `Bạn là AI Copilot - trợ lý CRM thông minh cho hệ thống quản lý khách hàng. 
Bạn có thể truy cập dữ liệu CRM sau:
- Tổng số khách hàng: ${crmContext.totalCustomers || 0}
- Khách hàng VIP: ${crmContext.vipCustomers || 0}
- Khách hàng hoạt động: ${crmContext.activeCustomers || 0}
- Khách hàng mới tháng này: ${crmContext.newCustomersThisMonth || 0}
- Tổng doanh thu: ${(crmContext.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ
- Doanh thu tháng này: ${(crmContext.monthlyRevenue || 0).toLocaleString('vi-VN')} VNĐ
- Tổng đơn hàng: ${crmContext.totalOrders || 0}
- Giá trị đơn hàng trung bình: ${(crmContext.avgOrderValue || 0).toLocaleString('vi-VN')} VNĐ
- Khách hàng có nguy cơ rời bỏ cao: ${crmContext.highRiskCustomers || 0}

Hãy trả lời bằng tiếng Việt, ngắn gọn, chuyên nghiệp và hữu ích. Nếu người dùng hỏi về dữ liệu CRM, hãy sử dụng thông tin trên.`;

            const postData = JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nNgười dùng hỏi: ${prompt}`
                    }]
                }]
            });

            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: '/v1beta/models/gemini-2.0-flash:generateContent',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GOOGLE_AI_API_KEY
                }
            };

            console.log('Calling Gemini API...');

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        console.log('Gemini API response status:', res.statusCode);
                        const jsonData = JSON.parse(data);
                        
                        if (jsonData.candidates && jsonData.candidates[0]?.content?.parts?.[0]?.text) {
                            console.log('Gemini API success!');
                            resolve(jsonData.candidates[0].content.parts[0].text);
                        } else if (jsonData.error) {
                            console.error('Gemini API Error:', jsonData.error.message);
                            resolve(null);
                        } else {
                            console.log('Gemini API unexpected response:', JSON.stringify(jsonData).substring(0, 200));
                            resolve(null);
                        }
                    } catch (e) {
                        console.error('Error parsing Gemini response:', e.message);
                        resolve(null);
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Error calling Gemini API:', error.message);
                resolve(null);
            });

            req.write(postData);
            req.end();
        } catch (error) {
            console.error('Error in callGeminiAPI:', error.message);
            resolve(null);
        }
    });
}

// Helper: Tạo AI response dựa trên context CRM (fallback)
function generateAIResponse(userMessage, crmContext) {
    const message = userMessage.toLowerCase();
    
    // Phân tích ý định người dùng
    if (message.includes('khách hàng') || message.includes('customer')) {
        if (message.includes('tổng') || message.includes('total') || message.includes('có bao nhiêu')) {
            return `Hiện tại hệ thống có ${crmContext.totalCustomers} khách hàng. Trong đó có ${crmContext.vipCustomers} khách hàng VIP và ${crmContext.activeCustomers} khách hàng đang hoạt động.`;
        }
        if (message.includes('mới') || message.includes('new')) {
            return `Trong tháng này, chúng ta đã có ${crmContext.newCustomersThisMonth} khách hàng mới. Tăng trưởng so với tháng trước là ${crmContext.growthRate}%.`;
        }
        if (message.includes('churn') || message.includes('rời') || message.includes('mất')) {
            return `Hiện có ${crmContext.highRiskCustomers} khách hàng có nguy cơ rời bỏ cao. Tôi khuyên bạn nên liên hệ họ ngay với các chương trình ưu đãi đặc biệt.`;
        }
    }
    
    if (message.includes('doanh thu') || message.includes('revenue') || message.includes('bán')) {
        if (message.includes('tháng') || message.includes('month')) {
            return `Doanh thu tháng này là ${crmContext.monthlyRevenue?.toLocaleString('vi-VN')} VNĐ, ${crmContext.revenueGrowth > 0 ? 'tăng' : 'giảm'} ${Math.abs(crmContext.revenueGrowth)}% so với tháng trước.`;
        }
        if (message.includes('hôm nay') || message.includes('today')) {
            return `Doanh thu hôm nay đạt ${crmContext.todayRevenue?.toLocaleString('vi-VN')} VNĐ từ ${crmContext.todayOrders} đơn hàng.`;
        }
        return `Tổng doanh thu của hệ thống là ${crmContext.totalRevenue?.toLocaleString('vi-VN')} VNĐ. Bạn muốn xem báo cáo chi tiết cho khoảng thời gian nào?`;
    }
    
    if (message.includes('đơn hàng') || message.includes('order') || message.includes('giao dịch')) {
        return `Hiện có ${crmContext.totalOrders} đơn hàng trong hệ thống. Giá trị đơn hàng trung bình là ${crmContext.avgOrderValue?.toLocaleString('vi-VN')} VNĐ.`;
    }
    
    if (message.includes('báo cáo') || message.includes('report') || message.includes('thống kê')) {
        return `Tôi có thể giúp bạn tạo các báo cáo về:\n- Doanh thu và tăng trưởng\n- Phân tích khách hàng\n- Hiệu suất bán hàng\n- Dự đoán churn\n\nBạn muốn xem báo cáo nào?`;
    }
    
    if (message.includes('top') || message.includes('tốt nhất') || message.includes('xuất sắc')) {
        return `Top 3 khách hàng chi tiêu nhiều nhất:\n1. ${crmContext.topCustomers?.[0] || 'N/A'}\n2. ${crmContext.topCustomers?.[1] || 'N/A'}\n3. ${crmContext.topCustomers?.[2] || 'N/A'}`;
    }
    
    if (message.includes('chào') || message.includes('hello') || message.includes('hi')) {
        return 'Xin chào! Tôi là AI Copilot, trợ lý CRM thông minh. Tôi có thể giúp bạn:\n- Phân tích dữ liệu khách hàng\n- Dự đoán churn và xu hướng\n- Tạo báo cáo tự động\n- Tư vấn chiến lược kinh doanh\n\nBạn cần tôi hỗ trợ gì?';
    }
    
    if (message.includes('gợi ý') || message.includes('suggest') || message.includes('recommend')) {
        return `Dựa trên dữ liệu hiện tại, tôi gợi ý:\n1. Tập trung vào ${crmContext.highRiskCustomers} khách hàng có nguy cơ cao\n2. Tăng cường chăm sóc ${crmContext.vipCustomers} khách hàng VIP\n3. Phát triển chương trình loyalty cho khách hàng trung thành\n4. Tối ưu hóa các kênh bán hàng đang hoạt động tốt`;
    }
    
    // Default response
    return `Tôi hiểu bạn đang hỏi về "${userMessage}". Với vai trò trợ lý CRM, tôi có thể giúp bạn:\n- Phân tích khách hàng và doanh số\n- Dự đoán xu hướng và churn\n- Tạo báo cáo và insights\n- Gợi ý chiến lược kinh doanh\n\nBạn có thể hỏi cụ thể hơn về khách hàng, doanh thu, đơn hàng, hoặc báo cáo không?`;
}

// Helper: Lấy CRM context để AI có thông tin trả lời
async function getCRMContext() {
    try {
        const customers = await Customer.find({});
        const transactions = await Transaction.find({});
        
        const totalCustomers = customers.length;
        const vipCustomers = customers.filter(c => c.status === 'VIP').length;
        const activeCustomers = customers.filter(c => c.status === 'Active').length;
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newCustomersThisMonth = customers.filter(c => 
            new Date(c.createdDate) >= thirtyDaysAgo
        ).length;
        
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalOrders = transactions.length;
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTransactions = transactions.filter(t => 
            new Date(t.transactionDate) >= today
        );
        const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const todayOrders = todayTransactions.length;
        
        // Giả sử có 15% khách hàng có nguy cơ cao (có thể tính từ ChurnPrediction)
        const highRiskCustomers = Math.floor(totalCustomers * 0.15);
        
        // Top customers by spending
        const customerSpending = {};
        transactions.forEach(t => {
            const custName = t.customer?.toString();
            if (custName) {
                customerSpending[custName] = (customerSpending[custName] || 0) + (t.amount || 0);
            }
        });
        
        const topCustomerNames = Object.entries(customerSpending)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name]) => name);
        
        const topCustomers = await Customer.find({ 
            $or: [
                { name: { $in: topCustomerNames } },
                { _id: { $in: topCustomerNames.filter(n => n.match(/^[0-9a-fA-F]{24}$/)) } }
            ]
        });
        
        return {
            totalCustomers,
            vipCustomers,
            activeCustomers,
            newCustomersThisMonth,
            growthRate: Math.round(Math.random() * 20 + 5), // Mock
            highRiskCustomers,
            totalRevenue,
            monthlyRevenue: Math.round(totalRevenue * 0.3), // Mock
            revenueGrowth: Math.round(Math.random() * 30 - 10), // Mock
            todayRevenue,
            todayOrders,
            totalOrders,
            avgOrderValue,
            topCustomers: topCustomers.length > 0 
                ? topCustomers.map(c => `${c.name} (${customerSpending[c.name]?.toLocaleString('vi-VN')} VNĐ)`)
                : topCustomerNames.slice(0, 3).map(name => `${name} (${customerSpending[name]?.toLocaleString('vi-VN')} VNĐ)`)
        };
    } catch (error) {
        console.error('Error getting CRM context:', error);
        return {
            totalCustomers: 0,
            vipCustomers: 0,
            activeCustomers: 0,
            newCustomersThisMonth: 0,
            growthRate: 0,
            highRiskCustomers: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
            revenueGrowth: 0,
            todayRevenue: 0,
            todayOrders: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            topCustomers: []
        };
    }
}

// API 1: Lấy danh sách conversations của user
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user?.id || 'demo-user-id';
        
        const conversations = await ChatHistory.find({ 
            userId, 
            isActive: true 
        })
        .sort({ lastMessageAt: -1 })
        .select('title lastMessageAt metadata createdAt')
        .limit(50);
        
        const formatted = conversations.map(conv => ({
            id: conv._id,
            title: conv.title,
            date: conv.createdAt.toLocaleDateString('vi-VN'),
            lastMessageAt: conv.lastMessageAt,
            messageCount: conv.metadata?.totalMessages || 0
        }));
        
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy danh sách cuộc trò chuyện',
            error: error.message 
        });
    }
});

// API 2: Lấy chi tiết một conversation
router.get('/conversations/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const conversation = await ChatHistory.findById(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
        }
        
        res.json({
            id: conversation._id,
            title: conversation.title,
            messages: conversation.messages,
            createdAt: conversation.createdAt,
            lastMessageAt: conversation.lastMessageAt
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy cuộc trò chuyện',
            error: error.message 
        });
    }
});

// API 3: Tạo conversation mới
router.post('/conversations', async (req, res) => {
    try {
        const userId = req.user?.id || 'demo-user-id';
        
        const newConversation = new ChatHistory({
            userId,
            title: 'Cuộc trò chuyện mới',
            messages: [{
                type: 'assistant',
                content: 'Xin chào! Tôi là AI Copilot. Tôi có thể giúp gì cho bạn hôm nay?',
                timestamp: new Date()
            }],
            metadata: {
                totalMessages: 1
            }
        });
        
        await newConversation.save();
        
        res.json({
            id: newConversation._id,
            title: newConversation.title,
            date: newConversation.createdAt.toLocaleDateString('vi-VN'),
            messages: newConversation.messages
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ 
            message: 'Lỗi khi tạo cuộc trò chuyện',
            error: error.message 
        });
    }
});

// API 4: Gửi message và nhận response từ AI
router.post('/chat', async (req, res) => {
    try {
        const { conversationId, message } = req.body;
        const userId = req.user?.id || 'demo-user-id';
        
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message không được trống' });
        }
        
        // Tìm hoặc tạo conversation
        let conversation;
        if (conversationId) {
            conversation = await ChatHistory.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
            }
        } else {
            // Tạo conversation mới nếu chưa có
            conversation = new ChatHistory({
                userId,
                title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
                messages: []
            });
        }
        
        // Thêm user message
        const userMessage = {
            type: 'user',
            content: message,
            timestamp: new Date()
        };
        conversation.messages.push(userMessage);
        
        // Lấy CRM context
        const crmContext = await getCRMContext();
        
        // Thử gọi Google Gemini API trước
        let aiResponse = null;
        let modelUsed = 'CRM-AI-v1';
        
        if (GOOGLE_AI_API_KEY) {
            aiResponse = await callGeminiAPI(message, crmContext);
            if (aiResponse) {
                modelUsed = 'Gemini-1.5-Flash';
            }
        }
        
        // Fallback to local AI nếu Gemini không hoạt động
        if (!aiResponse) {
            aiResponse = generateAIResponse(message, crmContext);
        }
        
        // Thêm AI message
        const aiMessage = {
            type: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
            metadata: {
                model: modelUsed,
                tokens: aiResponse.length,
                responseTime: 100
            }
        };
        conversation.messages.push(aiMessage);
        
        // Update metadata
        conversation.lastMessageAt = new Date();
        conversation.metadata.totalMessages = conversation.messages.length;
        
        await conversation.save();
        
        res.json({
            conversationId: conversation._id,
            userMessage,
            aiMessage,
            title: conversation.title
        });
    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).json({ 
            message: 'Lỗi khi xử lý chat',
            error: error.message 
        });
    }
});

// API 5: Xóa conversation
router.delete('/conversations/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const conversation = await ChatHistory.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
        }
        
        // Soft delete
        conversation.isActive = false;
        await conversation.save();
        
        res.json({ message: 'Đã xóa cuộc trò chuyện' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ 
            message: 'Lỗi khi xóa cuộc trò chuyện',
            error: error.message 
        });
    }
});

// API 6: Cập nhật title của conversation
router.patch('/conversations/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { title } = req.body;
        
        const conversation = await ChatHistory.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
        }
        
        conversation.title = title || conversation.title;
        await conversation.save();
        
        res.json({ 
            message: 'Đã cập nhật tiêu đề',
            title: conversation.title 
        });
    } catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({ 
            message: 'Lỗi khi cập nhật cuộc trò chuyện',
            error: error.message 
        });
    }
});

module.exports = router;
