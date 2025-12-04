import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import ChatScreen from './screens/ChatScreen';
import ProtectedRoute from './components/ProtectedRoute';
//import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />

        {/* Protected Routes */}
        <Route
          path="/chatrooms"
          element={
            <ProtectedRoute>
              <ChatRoomScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:chatroomId"
          element={
            <ProtectedRoute>
              <ChatScreen />
            </ProtectedRoute>
          }
        />

        {/* Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
