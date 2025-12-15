const mongoose = require("mongoose");

// Schema cho lịch sử chat với AI Copilot
const MessageSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['user', 'assistant'],
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    metadata: {
        model: String,
        tokens: Number,
        responseTime: Number
    }
});

const ChatHistorySchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true 
    },
    title: { 
        type: String, 
        default: 'Cuộc trò chuyện mới'
    },
    messages: [MessageSchema],
    isActive: { 
        type: Boolean, 
        default: true 
    },
    lastMessageAt: { 
        type: Date, 
        default: Date.now 
    },
    metadata: {
        totalMessages: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
        category: String,
        tags: [String]
    }
}, {
    timestamps: true
});

// Index để tìm kiếm và sort
ChatHistorySchema.index({ userId: 1, lastMessageAt: -1 });
ChatHistorySchema.index({ userId: 1, isActive: 1 });

// Middleware để cập nhật lastMessageAt và totalMessages
ChatHistorySchema.pre('save', function(next) {
    if (this.messages && this.messages.length > 0) {
        this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
        this.metadata.totalMessages = this.messages.length;
    }
    next();
});

const ChatHistory = mongoose.model("ChatHistory", ChatHistorySchema);
module.exports = ChatHistory;
