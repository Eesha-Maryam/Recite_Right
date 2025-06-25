// src/pages/feedback.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/header';
import './feedback.css';

const FeedbackPage = () => {
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('accessToken');

  // Submit feedback to backend
  const submitFeedback = async (feedbackData) => {
    try {
      const response =
        await axios.post('http://localhost:5000/v1/feedback', feedbackData,

          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error submitting feedback:', error?.response?.data?.error);
      setMessage('Submission failed');
    }
  };


  // Fetch all feedbacks from backend
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/v1/feedback', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFeedbackList(response.data.data);
    } catch (error) {
      console.error('Error fetching feedback:', error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  // Form submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackType || !feedbackText.trim()) return;

    const newFeedback = {
      type: feedbackType,
      text: feedbackText,
      rating,
    };

    try {
      await submitFeedback(newFeedback);
      await fetchFeedback(); // Refresh feedback list
      setFeedbackType('');
      setFeedbackText('');
      setRating(0);
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="feedback-container">
      <Header />

      <main className="main-content">
        <p className="intro-text">
          Choose a feedback type, write your message, and hit <span className="intro-text-bold">"Submit"</span> — we’d love to hear from you!
        </p>
        <div className="feedback-blocks">
          {/* Feedback Form Block */}
          <section className="feedback-section block">
            <div className="block-header">Feedback</div>

            {message && <div className="message">{message}</div>}

            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
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

          {/* Recent Feedback Block */}
          <section className="recent-feedback-section block">
            <div className="block-header">
              <span>Recent Feedback</span>
              {/* Optional Search */}
              {/* <input type="search" placeholder="Search..." className="search-input" /> */}
            </div>

            <div className="feedback-list">
              {loading ? (
                <p>Loading feedback...</p>
              ) : feedbackList.length === 0 ? (
                <p>No feedback yet.</p>
              ) : (
                feedbackList.map((item, index) => (
                  <article key={index} className="feedback-item">
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
                    <div className="stars-display">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fa-star ${item.rating >= star ? 'fas' : 'far'}`}
                        ></i>
                      ))}
                      <span className="rating-score">{item.rating}/5</span>
                    </div>
                    <p className="">{item.text}</p>
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
