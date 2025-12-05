import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserChatrooms, createChatroom, logoutUser, searchUsers, joinChatroom, getChatroomParticipants, getChatroomParticipantsCount } from 'common/usecases';
import ChatScreen from './ChatScreen';
import '../css/ChatRoomScreen.css';

const ChatRoomScreen = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedChatroom, setSelectedChatroom] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [newChatResults, setNewChatResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const fetchChatrooms = async () => {
    if (!userId) {
      setError('User not authenticated. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      const data = await getUserChatrooms(userId);
      console.log('Fetched chatrooms:', data);

      // For DMs, fetch participants to get the other user's name and count
      // For groups, fetch count
      const updatedData = await Promise.all(data.map(async (room) => {
        if (room.type === 'DM') {
          try {
            const participants = await getChatroomParticipants(userId, room.id);
            const otherUser = participants.find(p => p.id !== parseInt(userId));
            if (otherUser) {
              room.name = otherUser.username;
            }
            room.participantCount = participants.length;
          } catch (err) {
            console.error('Failed to fetch participants for DM:', err);
            room.participantCount = 0;
          }
        } else {
          try {
            room.participantCount = await getChatroomParticipantsCount(userId, room.id);
          } catch (err) {
            console.error('Failed to fetch count for group:', err);
            room.participantCount = 0;
          }
        }
        return room;
      }));

      setChatrooms(updatedData || []);
    } catch (err) {
      setError('Failed to fetch chatrooms');
    }
  };

  const handleCreateChatroom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Please enter a chatroom name');
      return;
    }

    setLoading(true);
    try {
      await createChatroom(userId, roomName, 'GROUP');
      setRoomName('');
      await fetchChatrooms();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to create chatroom');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser(userId);
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.clear();
    navigate('/login');
  };

  const handleSearchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchUsers(userId, query);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleJoinChatroom = async (chatroomId) => {
    try {
      await joinChatroom(userId, chatroomId);
      await fetchChatrooms();
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setError('Failed to join chatroom');
    }
  };

  const handleStartDM = async (otherUserId) => {
    try {
      const chatroom = await createChatroom(userId, '', 'DM', [otherUserId]);
      console.log('Started DM chatroom:', chatroom);
      await fetchChatrooms();
      setSelectedChatroom(chatroom);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setError('Failed to start DM');
    }
  };

  const handleSearchUsersForNewChat = async (query) => {
    if (!query.trim()) {
      setNewChatResults([]);
      return;
    }

    try {
      const results = await searchUsers(userId, query);
      setNewChatResults(results || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateNewChat = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      let chatroom;
      if (selectedUsers.length === 1) {
        chatroom = await createChatroom(userId, '', 'DM', [selectedUsers[0].id]);
        chatroom.name = selectedUsers[0].username; // Set name for display
        console.log('Started DM chatroom:', chatroom.name);
      } else {
        if (!groupName.trim()) {
          setError('Please enter a group name');
          setLoading(false);
          return;
        }
        chatroom = await createChatroom(userId, groupName, 'group', selectedUsers.map(u => u.id));
      }
      await fetchChatrooms();
      setSelectedChatroom(chatroom);
      setShowNewChatModal(false);
      setNewChatSearchQuery('');
      setNewChatResults([]);
      setSelectedUsers([]);
      setGroupName('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  const refreshChatrooms = async () => {
    await fetchChatrooms();
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchChatrooms();
  }, [userId, navigate]);

  return (
    <div className="chatroom-wrapper">
      {/* Sidebar */}
      <div className="chatroom-sidebar">
        <div className="sidebar-header">
          <h1>ChatPro</h1>
          <div className="header-actions">
            <button
              className="icon-btn"
              title="New chat"
              onClick={() => setShowNewChatModal(true)}
            >
              ➕
            </button>
            <button
              className="icon-btn"
              title="Search chatrooms"
              onClick={() => setShowSearchModal(true)}
            >
              🔍
            </button>
            <button
              className="icon-btn logout-btn"
              title="Logout"
              onClick={handleLogout}
            >
              🚪
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="chatroom-list">
          <p className="list-label">CHATS</p>
          {chatrooms.length === 0 ? (
            <div className="empty-state">
              <p>No chats yet</p>
              <p className="empty-hint">Create a group or search for existing ones</p>
            </div>
          ) : (
            chatrooms.map((room) => {
              const displayName = room.type === 'DM' ? (room.name || 'DM') : room.name;
              const initial = room.type === 'DM' && room.name ? room.name.charAt(0).toUpperCase() : (room.type === 'DM' ? '👤' : '👥');
              return (
                <div
                  key={room.id}
                  className="chatroom-item"
                  onClick={() => setSelectedChatroom(room)}
                >
                  <div className="room-icon">
                    {initial}
                  </div>
                  <div className="room-info">
                    <div className="room-name">{displayName}</div>
                    <div className="room-preview">{room.type === 'DM' ? '' : `${room.participantCount} members`}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="user-info">
          <p>Logged in as: <strong>{username}</strong></p>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Find Users</h2>
              <button
                className="close-btn"
                onClick={() => setShowSearchModal(false)}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearchUsers(e.target.value);
              }}
              className="search-input"
              autoFocus
            />

            <div className="search-results">
              {searchResults.length === 0 ? (
                <p className="no-results">
                  {searchQuery ? 'No results found' : 'Start typing to search'}
                </p>
              ) : (
                searchResults.map((user) => (
                  <div key={user.id} className="search-result-item">
                    <div className="result-info">
                      <p className="result-name">{user.username}</p>
                    </div>
                    <button
                      className="join-btn"
                      onClick={() => handleStartDM(user.id)}
                    >
                      Start Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Chat</h2>
              <button
                className="close-btn"
                onClick={() => setShowNewChatModal(false)}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search users..."
              value={newChatSearchQuery}
              onChange={(e) => {
                setNewChatSearchQuery(e.target.value);
                handleSearchUsersForNewChat(e.target.value);
              }}
              className="search-input"
              autoFocus
            />

            {selectedUsers.length > 1 && (
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="search-input"
              />
            )}

            <div className="search-results">
              {newChatResults.length === 0 ? (
                <p className="no-results">
                  {newChatSearchQuery ? 'No results found' : 'Start typing to search'}
                </p>
              ) : (
                newChatResults.map((user) => (
                  <div key={user.id} className="search-result-item">
                    <input
                      type="checkbox"
                      checked={selectedUsers.some(u => u.id === user.id)}
                      onChange={() => toggleUserSelection(user)}
                    />
                    <div className="result-info">
                      <p className="result-name">{user.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="modal-footer">
                <button
                  className="create-btn"
                  onClick={handleCreateNewChat}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : selectedUsers.length === 1 ? 'Start Chat' : 'Create Group'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="chatroom-main">
        {selectedChatroom ? (
          <ChatScreen chatroom={selectedChatroom} onBack={() => setSelectedChatroom(null)} refreshChatrooms={refreshChatrooms} />
        ) : (
          <div className="empty-main">
            <div className="logo">💬</div>
            <h2>ChatPro</h2>
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoomScreen;
