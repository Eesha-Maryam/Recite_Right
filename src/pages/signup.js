import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './signup.css';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeSlashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate form
    const validationErrors = {};
    if (!formData.firstName) validationErrors.firstName = 'First name is required';
    if (!formData.lastName) validationErrors.lastName = 'Last name is required';
    if (!formData.email) {
      validationErrors.email = 'Email is required';
    } else if (!/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      validationErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      validationErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }
    else if(!formData.confirmPassword) {
      validationErrors.confirmPassword = 'Confirm Password is required';
    }
    if (!termsAccepted) {
      validationErrors.terms = 'You must accept the terms';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

  try {
    const response = await axios.post('http://localhost:5000/v1/auth/register', {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password
    });


    if (response.status === 201) {
      setShowSuccessDialog(true);
    }
    
  } catch (error) {
    console.error('Signup error:', error);
    if (error.response) {
      if (error.response.status === 400) {
        if (error.response.data.message === 'Email already taken') {
          setErrors({
            ...errors,
            email: 'Email already exists'
          });
        } else {
          alert(error.response.data.message || 'Registration failed');
        }
      } else {
        alert(error.response.data.message || 'Registration failed');
      }
    } else {
      alert('Network error. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};



  return (
    <div className="signup-page">
    {showSuccessDialog && (
  <div className="dialog-overlay">
    <div className="dialog-box">
      <h3 className="dialog-heading">Verify Your Email</h3>
      <p className="dialog-message">
        We've sent a verification email to <strong>{formData.email}</strong>. Please check your inbox and verify your email before logging in.
      </p>
      <div className="dialog-buttons">
            <button 
              className="dialog-button"
              onClick={() => {
                setShowSuccessDialog(false);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  confirmPassword: ''
                });
              }}
            >
              OK
            </button>
       
          </div>
    </div>
  </div>
)}

      <div className="form-container">
        {/* Left side - Banner */}
        <div className="form-banner">
     
        </div>

        {/* Right side - Form */}
        <div className="form-content">
          <h2>Sign Up</h2>
          <p>Create your account. It's free and only takes a minute</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="input-group">
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


<div className="login-input-group">
    <div className="input-with-toggle">
  <input
    type={showConfirmPassword ? "text" : "password"}
    name="confirmPassword"
    placeholder="Confirm Password"
    className="form-input"
    value={formData.confirmPassword}
    onChange={handleChange}
  />
  {formData.confirmPassword && (
    <button
      type="button"
      className="password-toggle"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
    >
      {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
    </button>
  )}
  </div>
  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
</div>

            <div className="terms-container">
              <input
                type="checkbox"
                id="terms"
                className="form-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label htmlFor="terms" className="terms-label">
                I accept the{' '}
                <a href="#" className="terms-link">Terms of Use</a>{' '}
                &{' '}
                <a href="#" className="terms-link">Privacy Policy</a>
              </label>
            </div>
            {errors.terms && <span className="error-message">{errors.terms}</span>}

            <button 
              type="submit" 
              className="form-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
            <div className="login-link">
  Already have an account? <a href="/login">log In</a>
</div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;