// src/pages/feedback.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/header';
import './feedback.css';

/**
 * FeedbackPage Component - Allows users to submit feedback and view recent feedback entries
 * Features:
 * - Feedback form with type selection, text input, and star rating
 * - Display of recent feedback from other users
 * - Integration with backend API for data persistence
 */
const FeedbackPage = () => {
  // State management for form inputs and feedback data
  const [feedbackType, setFeedbackType] = useState('');       // Selected feedback type
  const [feedbackText, setFeedbackText] = useState('');       // User's feedback text
  const [rating, setRating] = useState(0);                    // Star rating (0-5)
  const [feedbackList, setFeedbackList] = useState([]);       // List of recent feedbacks
  const [loading, setLoading] = useState(false);              // Loading state for API calls
  const [message, setMessage] = useState('');                 // Status messages for user

  // Get JWT token from local storage for authenticated requests
  const token = localStorage.getItem('accessToken');

  /**
   * Submits feedback data to the backend API
   * @param {Object} feedbackData - Contains type, text, and rating
   */
  const submitFeedback = async (feedbackData) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/v1/feedback', 
        feedbackData,
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Authentication header
            'Content-Type': 'application/json',
          },
        }
      );
      setMessage(response.data.message);  // Show success message
    } catch (error) {
      console.error('Error submitting feedback:', error?.response?.data?.error);
      setMessage('Submission failed');    // Show error message
    }
  };

  /**
   * Fetches all feedback entries from the backend
   */
  const fetchFeedback = async () => {
    try {
      setLoading(true);  // Show loading state
      const response = await axios.get('http://localhost:5000/v1/feedback', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFeedbackList(response.data.data);  // Update feedback list
    } catch (error) {
      console.error('Error fetching feedback:', error?.response?.data?.error);
    } finally {
      setLoading(false);  // Hide loading state
    }
  };

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!feedbackType || !feedbackText.trim()) return;

    // Prepare feedback payload
    const newFeedback = {
      type: feedbackType,
      text: feedbackText,
      rating,
    };

    try {
      await submitFeedback(newFeedback);  // Submit to backend
      await fetchFeedback();             // Refresh feedback list
      
      // Reset form fields
      setFeedbackType('');
      setFeedbackText('');
      setRating(0);
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  // Fetch feedback data on component mount
  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="feedback-container">
      <Header />

      <main className="main-content">
        {/* Introduction text */}
        <p className="intro-text">
          Choose a feedback type, write your message, and hit <span className="intro-text-bold">"Submit"</span> — we'd love to hear from you!
        </p>

        <div className="feedback-blocks">
          {/* ========== FEEDBACK FORM SECTION ========== */}
          <section className="feedback-section block">
            <div className="block-header">Feedback</div>

            {/* Display status messages */}
            {message && <div className="message">{message}</div>}

            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
              {/* Feedback type dropdown */}
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                required
                className="feedback-select"
              >
                <option value="" disabled>Select Feedback Type</option>
                <option>Feature Enhancement</option>
                <option>New Feature</option>
                <option>Bug Report</option>
                <option>General Comment</option>
              </select>

              {/* Feedback text input and submit button */}
              <div className="feedback-input-group">
                <input
                  type="text"
                  placeholder="Enter your feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                  className="feedback-text"
                />
                <button type="submit" className="submit-button">
                  Submit
                </button>
              </div>

              {/* Star rating component */}
              <div className="rating-section">
                <h3 className="rating-heading">Rating</h3>
                <div className="star-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`fa-star ${rating >= star ? 'fas' : 'far'}`}
                      onClick={() => setRating(star)}
                      style={{ cursor: 'pointer' }}
                    ></i>
                  ))}
                </div>
              </div>
            </form>
          </section>

          {/* ========== RECENT FEEDBACK SECTION ========== */}
          <section className="recent-feedback-section block">
            <div className="block-header">
              <span>Recent Feedback</span>
              {/* Future enhancement: Search functionality */}
              {/* <input type="search" placeholder="Search..." className="search-input" /> */}
            </div>

            <div className="feedback-list">
              {/* Loading state */}
              {loading ? (
                <p>Loading feedback...</p>
              ) : 
              /* Empty state */
              feedbackList.length === 0 ? (
                <p>No feedback yet.</p>
              ) : (
                /* Feedback list items */
                feedbackList.map((item, index) => (
                  <article key={index} className="feedback-item">
                    {/* User info header */}
                    <div className="feedback-item-header">
                      <div className="user-info">
                        <img
                          src={item.user?.avatar || '/default-avatar.png'}
                          alt="avatar"
                          className="avatar"
                        />
                        <span className="user-name">{item.user?.name || 'Anonymous'}</span>
                      </div>
                      <h3 className="feedback-type">{item.type}</h3>
                    </div>

                    {/* Star rating display */}
                    <div className="stars-display">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fa-star ${item.rating >= star ? 'fas' : 'far'}`}
                        ></i>
                      ))}
                      <span className="rating-score">{item.rating}/5</span>
                    </div>

                    {/* Feedback text content */}
                    <p className="feedback-user">{item.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default FeedbackPage;