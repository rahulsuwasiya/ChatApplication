const API_BASE_URL = 'http://localhost:8080/api';

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', body = null, headers = {}) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
  }

  return await response.json();
};

// Auth APIs
export const registerUser = (username, password) => {
  return apiCall('/users/register', 'POST', { username, password });
};

export const loginUser = (username, password) => {
  return apiCall('/users/login', 'POST', { username, password }).then((response) => {
    if (!response.id && response.userId) {
      response.id = response.userId;
    }
    return response;
  });
};

export const logoutUser = (userId) => {
  return apiCall('/users/logout', 'POST', null, { userId });
};

// Chatroom APIs
export const getUserChatrooms = (userId) => {
  return apiCall(`/users/${userId}/chatrooms`);
};

export const createChatroom = (userId, chatroomName, type = 'group', participantIds = []) => {
  console.log('Creating chatroom with type:', userId, chatroomName, type, participantIds);
  return apiCall('/chatrooms', 'POST', { name: chatroomName, type, participantIds }, { userId });
};

export const joinChatroom = (userId, chatroomId) => {
  return apiCall(`/chatrooms/${chatroomId}/join`, 'POST', null, { userId });
};

export const getChatroomParticipants = (userId, chatroomId) => {
  return apiCall(`/chatrooms/${chatroomId}/participants`, 'GET', null, { userId });
};

export const getChatroomParticipantsCount = (userId, chatroomId) => {
  return apiCall(`/chatrooms/${chatroomId}/participants/count`, 'GET', null, { userId });
};

// Message APIs
export const sendMessage = (userId, chatroomId, content) => {
  return apiCall(`/chatrooms/${chatroomId}/messages`, 'POST', { content }, { userId });
};

export const getMessages = (userId, chatroomId) => {
  return apiCall(`/chatrooms/${chatroomId}/messages`, 'GET', null, { userId });
};

// User Search
export const searchUsers = (userId, query) => {
  return apiCall(`/users/search?query=${encodeURIComponent(query)}`, 'GET', null, { userId });
};

// Chatroom Search
export const searchChatrooms = (userId, query) => {
  return apiCall(`/chatrooms/search?query=${encodeURIComponent(query)}`, 'GET', null, { userId });
};

// Delete Chatroom
export const deleteChatroom = (userId, chatroomId) => {
  return apiCall(`/delete/chatroom/${chatroomId}`, 'DELETE', null, { userId });
};
