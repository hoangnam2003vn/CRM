import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMenu, FiPlus, FiMessageSquare, FiTrash2, FiSettings, FiUser } from 'react-icons/fi';
import './copilot-ai.css';

export default function CopilotAI() {
  // State quản lý các cuộc trò chuyện
  const [conversations, setConversations] = useState([]);
  
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // API URL
  const API_URL = 'http://localhost:5000/api';

  // Lấy cuộc trò chuyện hiện tại
  const currentConversation = conversations.find(conv => conv.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations khi component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load danh sách conversations từ API
  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await fetch(`${API_URL}/copilot/conversations`, config);
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Đảm bảo mỗi conversation có messages là array
        const formattedData = data.map(conv => ({
          ...conv,
          messages: Array.isArray(conv.messages) ? conv.messages : []
        }));
        setConversations(formattedData);
        setCurrentConversationId(formattedData[0].id);
        
        // Load chi tiết conversation đầu tiên
        await loadConversationDetail(formattedData[0].id);
      } else {
        // Nếu chưa có conversation, tạo mới
        await handleNewConversation();
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Tạo conversation mặc định nếu lỗi
      await handleNewConversation();
      setLoading(false);
    }
  };

  // Load chi tiết conversation (bao gồm messages)
  const loadConversationDetail = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/copilot/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data && data.id) {
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: Array.isArray(data.messages) ? data.messages : [] }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error loading conversation detail:', error);
    }
  };

  // Hàm tạo cuộc trò chuyện mới
  const handleNewConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/copilot/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const newConversation = await response.json();
      // Đảm bảo messages là array
      const formattedConv = {
        ...newConversation,
        messages: Array.isArray(newConversation.messages) ? newConversation.messages : []
      };
      setConversations([formattedConv, ...conversations]);
      setCurrentConversationId(formattedConv.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback: tạo local
      const newId = Math.max(...conversations.map(c => c.id || 0), 0) + 1;
      const newConversation = {
        id: newId,
        title: 'Cuộc trò chuyện mới',
        date: new Date().toLocaleDateString('vi-VN'),
        messages: [
          {
            id: 1,
            type: 'assistant',
            content: 'Xin chào! Tôi là AI Copilot. Tôi có thể giúp gì cho bạn hôm nay?',
            timestamp: new Date()
          }
        ]
      };
      
      setConversations([newConversation, ...conversations]);
      setCurrentConversationId(newId);
    }
  };

  // Hàm chuyển đổi cuộc trò chuyện
  const handleSelectConversation = async (conversationId) => {
    setCurrentConversationId(conversationId);
    // Load chi tiết conversation nếu chưa có messages
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv?.messages || conv.messages.length === 0) {
      await loadConversationDetail(conversationId);
    }
  };

  // Hàm cập nhật tiêu đề cuộc trò chuyện dựa trên tin nhắn đầu tiên
  const updateConversationTitle = (conversationId, firstUserMessage) => {
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === conversationId && conv.title === 'Cuộc trò chuyện mới'
          ? { 
              ...conv, 
              title: firstUserMessage.substring(0, 30) + (firstUserMessage.length > 30 ? '...' : ''),
              date: new Date().toLocaleDateString('vi-VN')
            }
          : conv
      )
    );
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // Cập nhật UI ngay lập tức
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, messages: [...(Array.isArray(conv.messages) ? conv.messages : []), userMessage] }
          : conv
      )
    );

    const messageToSend = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/copilot/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          message: messageToSend
        })
      });

      const data = await response.json();
      
      // Kiểm tra response có lỗi không
      if (!response.ok || !data.aiMessage) {
        throw new Error(data.message || 'Không thể nhận phản hồi từ AI');
      }
      
      setIsTyping(false);
      setIsStreaming(true);
      
      const fullMessage = data.aiMessage.content;
      let currentIndex = 0;
      
      // Typing effect
      const typingInterval = setInterval(() => {
        if (currentIndex < fullMessage.length) {
          setStreamingMessage(fullMessage.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsStreaming(false);
          setStreamingMessage('');
          
          // Cập nhật conversation với AI message
          setConversations(prevConversations =>
            prevConversations.map(conv =>
              conv.id === currentConversationId
                ? { 
                    ...conv, 
                    messages: [...(Array.isArray(conv.messages) ? conv.messages : []), data.aiMessage],
                    title: data.title || conv.title
                  }
                : conv
            )
          );
        }
      }, 20);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Fallback response
      const fallbackMessage = {
        type: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...(Array.isArray(conv.messages) ? conv.messages : []), fallbackMessage] }
            : conv
        )
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Hàm xóa cuộc trò chuyện
  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation(); // Ngăn chặn click vào conversation item
    
    if (!window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/copilot/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Xóa khỏi state local
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        
        // Nếu đang xóa conversation hiện tại, chuyển sang conversation khác
        if (currentConversationId === conversationId) {
          const remaining = conversations.filter(conv => conv.id !== conversationId);
          if (remaining.length > 0) {
            setCurrentConversationId(remaining[0].id);
          } else {
            // Nếu không còn conversation nào, tạo mới
            await handleNewConversation();
          }
        }
      } else {
        console.error('Failed to delete conversation');
        alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Lỗi khi xóa cuộc trò chuyện.');
    }
  };

  return (
    <div className="copilot-container">
      {/* Sidebar */}
      <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewConversation}>
            <FiPlus style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>

        <div className="sidebar-content">
          <h3 className="sidebar-title">Lịch sử trò chuyện</h3>
          <div className="conversation-list">
            {conversations.map((conv) => (
              <div 
                key={conv.id} 
                className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
              >
                <button 
                  className="conversation-item-btn"
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div className="conversation-item-content">
                    <FiMessageSquare className="conversation-icon" />
                    <div className="conversation-details">
                      <p className="conversation-title">{conv.title}</p>
                      <p className="conversation-date">{conv.date}</p>
                    </div>
                  </div>
                </button>
                <button 
                  className="delete-conversation-btn"
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  title="Xóa cuộc trò chuyện"
                >
                  <FiTrash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-footer-btn">
            <FiSettings style={{ width: '1rem', height: '1rem' }} />
            <span>Cài đặt</span>
          </button>
          <button className="sidebar-footer-btn">
            <FiUser style={{ width: '1rem', height: '1rem' }} />
            <span>Tài khoản</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>
            <div>
              <h1 className="header-title">AI Copilot</h1>
              <p className="header-subtitle">Trợ lý thông minh của bạn</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-header">
              <FiMessageSquare className="stat-icon" />
              <h3 className="stat-title">Tổng tin nhắn</h3>
            </div>
            <p className="stat-value">{messages.length}</p>
            <p className="stat-description">Trong phiên này</p>
          </div>

          <div className="stat-card teal">
            <div className="stat-header">
              <FiUser className="stat-icon" />
              <h3 className="stat-title">Cuộc trò chuyện</h3>
            </div>
            <p className="stat-value">{conversations.length}</p>
            <p className="stat-description">Đã lưu</p>
          </div>

          <div className="stat-card mixed">
            <div className="stat-header">
              <FiSettings className="stat-icon" />
              <h3 className="stat-title">Trạng thái</h3>
            </div>
            <p className="stat-value">Online</p>
            <p className="stat-description">Sẵn sàng hỗ trợ</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-container">
          {messages.map((message, index) => (
            <div key={message.id || `msg-${index}`} className={`message-wrapper ${message.type}`}>
              {message.type === 'assistant' && (
                <div className="message-avatar assistant-avatar">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                  </svg>
                </div>
              )}
              <div className={`message ${message.type}`}>
                <p className="message-content">{message.content}</p>
                <p className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.type === 'user' && (
                <div className="message-avatar user-avatar">
                  <FiUser />
                </div>
              )}
            </div>
          ))}

          {/* Streaming message (đang typing) */}
          {isStreaming && (
            <div className="message-wrapper assistant">
              <div className="message-avatar assistant-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="message assistant streaming">
                <p className="message-content">{streamingMessage}<span className="cursor">|</span></p>
              </div>
            </div>
          )}

          {isTyping && !isStreaming && (
            <div className="typing-indicator">
              <div className="message-avatar assistant-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="typing-bubble">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <div className="input-wrapper">
              <div className="input-box">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="input-textarea"
                  rows="2"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`send-btn ${inputValue.trim() ? 'active' : 'disabled'}`}
              >
                <FiSend className="send-icon" />
              </button>
            </div>
            <p className="input-hint">
              Nhấn Enter để gửi, Shift + Enter để xuống dòng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}