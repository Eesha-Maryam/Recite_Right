import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/header';
import './profile.css';

const UserProfile = ({ setAuthenticated }) => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
    createdAt: '',
    streak: 0,
    role: ''
  });

  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [apiError, setApiError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
   const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

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

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token available');

      const response = await axios.get('http://localhost:5000/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return setApiError('Please select an image file');

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('avatar', avatarFile);

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
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to upload avatar');
    }
  };

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
        {apiError && (
          <div className="alert alert-error">
            {apiError}
            <button className="alert-close" onClick={() => setApiError('')}>×</button>
          </div>
        )}

        <div className="profile-card">
          <div className="profile-header">
            <h2>Profile Information</h2>
          </div>

          <div className="profile-content">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img
                  src={avatarPreview || userData.avatar || '/default-avatar.png'}
                  alt="Profile"
                  className="user-avatar"
                />
              </div>
              <div className="avatar-controls">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-upload" className="btn btn-outline">
                  Change Photo
                </label>
                <button
                  onClick={handleUploadAvatar}
                  className="btn btn-primary"
                  disabled={!avatarFile}
                >
                  Save Photo
                </button>
              </div>
            </div>

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

        <div className="action-btn">
          <button onClick={handleLogout} className="btn btn-warning">Logout</button>
          <button onClick={handleDeleteAccount} className="btn btn-danger">Delete Account</button>
        </div>
      </main>

      {/* Success Dialog */}
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