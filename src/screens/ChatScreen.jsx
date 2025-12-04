import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage, getChatroomParticipantsCount, deleteChatroom } from '../services/api';
import '../css/ChatScreen.css';

const ChatScreen = ({ chatroom: propChatroom, onBack, refreshChatrooms }) => {
  const { chatroomId: paramsChatroomId } = useParams();
  const chatroom = propChatroom || { id: paramsChatroomId };
  const chatroomId = chatroom.id;
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatroomName, setChatroomName] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await getMessages(userId, chatroomId);
      setMessages(data || []);
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  const fetchParticipantCount = async () => {
    try {
      const count = await getChatroomParticipantsCount(userId, chatroomId);
      setParticipantCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch participant count:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    setSending(true);
    try {
      await sendMessage(userId, chatroomId, messageText);
      setMessageText('');
      await fetchMessages();
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChatroom = async () => {
    if (!window.confirm('Are you sure you want to delete this chatroom?')) return;

    try {
      await deleteChatroom(userId, chatroomId);
      await refreshChatrooms();
      onBack();
    } catch (err) {
      setError('Failed to delete chatroom');
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial data
  useEffect(() => {
    if (!userId || !chatroomId) {
      navigate('/chatrooms');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchParticipantCount()]);
      setLoading(false);
    };

    loadData();

    // polling for new messages every 5 seconds
    // const interval = setInterval(fetchMessages, 5000);
    // return () => clearInterval(interval);
  }, [userId, chatroomId, navigate]);

  // Set chatroom name
  useEffect(() => {
    if (chatroom) {
      setChatroomName(chatroom.name || (chatroom.type === 'DM' ? 'DM' : 'Group Chat'));
    }
  }, [chatroom]);

  return (
    <div className="chat-wrapper">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack || (() => navigate('/chatrooms'))}>
            ←
          </button>
          <div className="header-info">
            <h2>{chatroomName || 'Chat Room'}</h2>
            <p className="participant-count">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="header-right">
          <button className="info-btn" title="Participants">
            ℹ️
          </button>
          <button className="delete-btn" title="Delete Chatroom" onClick={handleDeleteChatroom}
            style={{
              backgroundColor: "#f47a6cff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "5px 10px",
              cursor: "pointer"
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {loading ? (
          <div className="loading-state">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet</p>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg.sender?.id === parseInt(userId) ? 'sent' : 'received'
              }`}
            >
              <div className="message-content">
                <p className="message-sender">
                  {msg.sender?.username || 'Unknown'}
                </p>
                <p className="message-text">{msg.content}</p>
                <p className="message-time">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && <div className="error-banner">{error}</div>}

      {/* Input Area */}
      <div className="chat-input-area">
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="message-input"
            disabled={sending}
            maxLength={1000}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={sending || !messageText.trim()}
          >
            {sending ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
