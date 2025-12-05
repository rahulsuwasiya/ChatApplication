import React, { useState, useEffect } from 'react';
import { searchUsers, joinChatroom } from 'common/usecases';

const UsersList = () => {
  const userId = localStorage.getItem('userId');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(userId, query);
      setUsers(results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (chatroomId) => {
    try {
      await joinChatroom(userId, chatroomId);
      // Optionally navigate to chat room
    } catch (err) {
      console.error('Failed to join:', err);
    }
  };

  return (
    <div className="users-list">
      <input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        className="search-input"
      />

      {loading && <p>Searching...</p>}

      <div className="users-container">
        {users.length === 0 ? (
          <p>No users found</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="user-item">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <p className="user-name">{user.username}</p>
              </div>
              <button
                className="start-chat-btn"
                onClick={() => handleStartChat(user.id)}
              >
                💬
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersList;
