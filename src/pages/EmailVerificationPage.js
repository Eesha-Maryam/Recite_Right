import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmailVerification.css';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    loading: true,
    message: 'Verifying your email...',
    isSuccess: false,
    showResend: false
  });

  useEffect(() => {
    const token = searchParams.get('token');
    const reason = searchParams.get('reason');

    // Handle direct access to success/failure pages
    if (window.location.pathname === '/email-verified-success') {
      setStatus({
        loading: false,
        message: '✅ Your email has been verified successfully!',
        isSuccess: true,
        showResend: false
      });
      return;
    }

    if (window.location.pathname === '/email-verification-failed') {
      let message = '❌ Email verification failed';
      switch(reason) {
        case 'already-verified':
          message = 'ℹ️ Your email was already verified';
          break;
        case 'expired':
          message = '⌛ Verification link expired - please request a new one';
          break;
        case 'invalid':
          message = '❌ Invalid verification token';
          break;
        case 'user-not-found':
          message = '❌ User account not found';
          break;
      }
      
      setStatus({
        loading: false,
        message,
        isSuccess: false,
        showResend: reason === 'expired' || reason === 'invalid'
      });
      return;
    }

    // Handle token verification
    if (token) {
      verifyToken(token);
    } else {
      setStatus({
        loading: false,
        message: '❌ Invalid verification link - no token provided',
        isSuccess: false,
        showResend: false
      });
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/v1/auth/verify-email/${token}`,
        { validateStatus: (status) => status < 500 }
      );

      if (response.status === 200) {
        setStatus({
          loading: false,
          message: '✅ Your email has been verified successfully!',
          isSuccess: true,
          showResend: false
        });
      } else {
        setStatus({
          loading: false,
          message: response.data?.message || '❌ Verification failed',
          isSuccess: false,
          showResend: true
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus({
        loading: false,
        message: error.response?.data?.message || '❌ Verification failed',
        isSuccess: false,
        showResend: true
      });
    }
  };

  const handleResend = async () => {
    try {
      const email = searchParams.get('email') || prompt('Please enter your email to resend verification:');
      if (!email) return;
      
      await axios.post('http://localhost:5000/v1/auth/resend-verification', { email });
      setStatus(prev => ({
        ...prev,
        message: '📨 New verification email sent! Check your inbox.',
        showResend: false
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        message: error.response?.data?.message || '❌ Failed to resend verification'
      }));
    }
  };

  return (
    <div className="email-verification-container">
      <div className={`verification-box ${status.isSuccess ? 'success' : 'error'}`}>
        <h2>{status.isSuccess ? 'Success!' : 'Verification Status'}</h2>
        <p>{status.message}</p>
        
        {status.loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="button-group">
            <button 
              className="primary-button"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
            
            {status.showResend && (
              <button 
                className="secondary-button"
                onClick={handleResend}
              >
                Resend Verification
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;