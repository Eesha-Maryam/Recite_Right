import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './login.css';

/**
 * EyeIcon Component - SVG icon for visible password state
 */
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

/**
 * EyeSlashIcon Component - SVG icon for hidden password state
 */
const EyeSlashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

/**
 * Login Component - Handles user authentication
 * @param {Object} props - Component props
 * @param {Function} props.setAuthenticated - Callback to set auth state
 */
const Login = ({ setAuthenticated }) => {
  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Component state
  const [rememberMe, setRememberMe] = useState(false);  // Remember me checkbox
  const [errors, setErrors] = useState({});             // Form validation errors
  const [isLoading, setIsLoading] = useState(false);    // Loading state during submission
  const navigate = useNavigate();                       // Router navigation
  const [showPassword, setShowPassword] = useState(false); // Password visibility toggle

  /**
   * Handles form input changes
   * @param {Object} e - Event object
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  /**
   * Handles form submission
   * @param {Object} e - Event object
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate form inputs
    const validationErrors = {};
    if (!formData.email) {
      validationErrors.email = 'Email is required';
    } else if (!/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      validationErrors.password = 'Password is required';
    }

    // Return if validation errors exist
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // API call to login endpoint
      const response = await axios.post('http://localhost:5000/v1/auth/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Full login response:', response.data); // Debug log

      // Handle successful login response
      if (response.data?.tokens?.access?.token && response.data?.tokens?.refresh?.token) {
        // Store tokens and user data in localStorage
        localStorage.setItem('accessToken', response.data.tokens.access.token);
        localStorage.setItem('refreshToken', response.data.tokens.refresh.token);
        localStorage.setItem('tokenType', response.data.tokens.access.tokenType || 'Bearer');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userId', response.data.user.id);

        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Update auth state and redirect
        setAuthenticated(true);
        navigate('/home');
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          setErrors({
            email: 'Invalid credentials',
            password: 'Invalid credentials'
          });
        }
      }
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-container">
        {/* Left side - Banner (currently commented out) */}
        <div className="login-form-banner">
          {/* Potential banner content can be added here */}
        </div>

        {/* Right side - Form */}
        <div className="login-form-content">
          <h2>Log In</h2>
          <p>Please enter your details to login</p>
          
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="login-input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Password Input with Toggle */}
            <div className="login-input-group">
              <div className="input-with-toggle">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                />
                {/* Show password toggle button (only when password is entered) */}
                {formData.password && (
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                )}
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="remember-forgot-row">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <a href="/forgot-password" className="forgot-password">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="form-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>

            {/* Sign Up Link */}
            <div className="signup-link">
              Don't have an account? <a href="/signup">Sign Up</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;