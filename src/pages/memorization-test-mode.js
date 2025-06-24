import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header'; 
import { FaCheck, FaPencilAlt, FaFire } from 'react-icons/fa'; 
import './Memorization-test-mode.css';

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
            <ul className="mode-description">
              <li>Ideal for beginners</li>
              <li>Covers foundational Quran knowledge</li>
              <li>Includes Activities like identifying and arranging missing words</li>
            </ul>
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
             <ul className="mode-description">
  <li>Designed for intermediate learners</li>
  <li>Offers a balanced challenge</li>
  <li>Includes recitation prompts and memorization activities</li>
</ul>
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
            <ul className="mode-description">
  <li>Hard Mode is for advanced learners</li>
  <li>Full Ayah recall and long passage recitation</li>
  <li>Mapping Surahs and Ayahs</li>
  <li>Challenging identification tasks</li>
</ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MemorizationTest;