import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/header';
import './profile.css';

/**
 * UserProfile Component - Displays and manages user profile information
 * Features:
 * - Displays user profile data (name, email, join date, streak)
 * - Handles avatar uploads and removal
 * - Provides logout functionality
 * - Allows account deletion
 * - Manages authentication tokens and session
 */
const UserProfile = ({ setAuthenticated }) => {
  // State for user profile data
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
    createdAt: '',
    streak: 0,
    role: ''
  });

  // Component state management
  const [loading, setLoading] = useState(true);              // Loading state
  const [avatarFile, setAvatarFile] = useState(null);        // Selected avatar file
  const [avatarPreview, setAvatarPreview] = useState('');    // Avatar preview URL
  const [apiError, setApiError] = useState('');             // API error messages
  const [showSuccessDialog, setShowSuccessDialog] = useState(false); // Success dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);   // Logout confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);   // Delete confirmation
  
  const navigate = useNavigate();

  /**
   * Checks if JWT token is valid
   * @param {string} token - JWT token to validate
   * @returns {boolean} True if token is valid
   */
  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  /**
   * Refreshes authentication tokens using refresh token
   * @returns {Promise<boolean>} True if refresh was successful
   */
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    try {
      const response = await axios.post('http://localhost:5000/v1/auth/refresh-tokens', { refreshToken });
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('accessToken', response.data.access.token);
        localStorage.setItem('refreshToken', response.data.refresh.token);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  /**
   * Handles API errors including token expiration
   * @param {Error} err - The error object
   */
  const handleApiError = async (err) => {
    console.error('API Error:', err);
    if (err.response?.status === 401) {
      try {
        const refreshed = await refreshToken();
        if (refreshed) return await fetchUser();
      } catch (refreshError) {
        console.error('Refresh failed:', refreshError);
      }

      setApiError('Session expired. Please login again.');
      localStorage.clear();
      setAuthenticated(false);
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setApiError(err.response?.data?.message || 'Request failed');
    }
  };

  /**
   * Fetches user profile data from API
   */
  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token available');

      const response = await axios.get('http://localhost:5000/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Split full name into first and last names
      const [firstName, ...lastNameParts] = response.data.name.split(' ');
      setUserData({
        ...response.data,
        firstName,
        lastName: lastNameParts.join(' '),
        streak: response.data.streak || 0
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const refresh = localStorage.getItem('refreshToken');
        if (!token || !refresh || !isTokenValid(token)) throw new Error('Authentication required');
        await fetchUser();
      } catch (error) {
        console.error('Initialization error:', error);
        localStorage.clear();
        setAuthenticated(false);
        navigate('/login');
      }
    };
    initializeProfile();
  }, [navigate]);

  /**
   * Handles form input changes
   * @param {Object} e - Event object
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handles avatar file selection
   * @param {Object} e - Event object
   */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  /**
   * Uploads avatar image to server
   * @param {File} file - The image file to upload
   */
  const handleUploadAvatar = async (file) => {
    if (!file) return setApiError('Please select an image file');

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(
        'http://localhost:5000/v1/users/me/avatar',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUserData(prev => ({
        ...prev,
        avatar: response.data.avatarUrl || response.data.avatar
      }));
      setShowSuccessDialog(true);
      setApiError('');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to upload avatar');
    }
  };

  /**
   * Removes user's avatar
   */
  const handleRemoveAvatar = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete('http://localhost:5000/v1/users/me/avatar', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setUserData(prev => ({ ...prev, avatar: '' }));
      setAvatarFile(null);
      setAvatarPreview('');
    } catch (err) {
      setApiError('Failed to remove avatar');
    }
  };

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token found');

      await axios.post(
        'http://localhost:5000/v1/auth/logout',
        { refreshToken },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      setAuthenticated(false);
      navigate('/login');
    }
  };

  /**
   * Deletes user account
   */
  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete('http://localhost:5000/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.clear();
      setAuthenticated(false);
      navigate('/signup');
    } catch (err) {
      handleApiError(err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <Header />
      <main className="user-profile-container">
        {/* Error message display */}
        {apiError && (
          <div className="alert alert-error">
            {apiError}
            <button className="alert-close" onClick={() => setApiError('')}>×</button>
          </div>
        )}

        {/* Profile card */}
        <div className="profile-card">
          <div className="profile-header">
            <h2>Profile Information</h2>
          </div>

          <div className="profile-content">
            {/* Avatar section */}
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img
                  src={avatarPreview || userData.avatar || '/default-avatar.png'}
                  className="user-avatar"
                />
              </div>
              <div className="avatar-controls">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                      await new Promise((res) => setTimeout(res, 100)); // wait for state to update
                      await handleUploadAvatar(file); // pass file directly
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-upload" className="btn btn-primary">
                  Upload
                </label>
              </div>
            </div>

            {/* User information section */}
            <div className="info-section">
              <div className="form-group">
                <div className="form-row">
                  <div className="form-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={userData.firstName}
                      onChange={handleChange}
                      readOnly
                      className="read-only"
                    />
                  </div>
                  <div className="form-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={userData.lastName}
                      onChange={handleChange}
                      readOnly
                      className="read-only"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    readOnly
                    className="read-only"
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Member Since</label>
                    <input
                      type="text"
                      value={userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                      readOnly
                      className="read-only"
                    />
                  </div>
                  <div className="form-field">
                    <label>Current Streak</label>
                    <input
                      type="text"
                      value={`${userData.streak} days`}
                      readOnly
                      className="read-only"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="action-btn">
          <button onClick={handleLogout} className="btn btn-warning">Logout</button>
          <button onClick={handleDeleteAccount} className="btn btn-danger">Delete Account</button>
        </div>
      </main>

      {/* Success dialog */}
      {showSuccessDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Success</h3>
            <p>Avatar uploaded successfully!</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowSuccessDialog(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;