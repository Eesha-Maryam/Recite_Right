import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header'; 
import { FaCheck, FaPencilAlt, FaFire } from 'react-icons/fa'; 
import './MemorizationTest.css';

const MemorizationTest = () => {
  const navigate = useNavigate();

  const handleCardClick = (mode) => {
  navigate('/surah-selection', { state: { testMode: mode } });

  };

  return (
    <div className="memorization-test">
      <Header />
      
      <main className="memorization-content">
        <h1 className="page-title">Quran Memorization Test</h1>
        
        <section className="test-mode-container">
          <h2 className="mode-selection-title">Choose Your Test Mode</h2>
          
          <div className="mode-cards">
            {/* Easy Mode Card */}
            <article 
              className="mode-card easy-mode"
              onClick={() => handleCardClick('easy')}
            >
              <div className="card-icon-container">
                <FaCheck className="card-icon easy-icon" />
              </div>
              <h3 className="mode-title">Easy Mode</h3>
              <p className="mode-description">
                Ideal for beginners, Basic Mode covers foundational Quran knowledge with common Surahs, 
                core concepts, and activities like identifying and arranging missing words.
              </p>
            </article>

            {/* Medium Mode Card */}
            <article 
              className="mode-card medium-mode"
              onClick={() => handleCardClick('medium')}
            >
              <div className="card-icon-container">
                <FaPencilAlt className="card-icon medium-icon" />
              </div>
              <h3 className="mode-title">Medium Mode</h3>
              <p className="mode-description">
                Designed for intermediate learners, Medium Mode offers a balanced challenge. 
                You'll be tested on more complex Surahs, recitation prompts, and memorization activities.
              </p>
            </article>

            {/* Hard Mode Card */}
            <article 
              className="mode-card hard-mode"
              onClick={() => handleCardClick('hard')}
            >
              <div className="card-icon-container">
                <FaFire className="card-icon hard-icon" />
              </div>
              <h3 className="mode-title">Hard Mode</h3>
              <p className="mode-description">
                Hard Mode is for advanced learners. You'll be tested on full Ayah recall, 
                mapping Surahs and Ayahs, long passage recitation, and identification tasks.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MemorizationTest;