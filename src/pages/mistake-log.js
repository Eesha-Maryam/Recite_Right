import React from 'react';
import { useNavigate } from 'react-router-dom';
import './mistake-log.css';

const MistakeLog = () => {
  const navigate = useNavigate();

  return (
    <div className="mistake-log-page">
      <header className="mistake-log-header">
        <span 
          className="material-icons back-arrow" 
          onClick={() => navigate('/')}
        >
          arrow_back
        </span>
        <h2>Mistake Log</h2>
      </header>

      <div className="mistake-log-content">
        <p className="no-mistake-text">No mistakes yet.</p>
      </div>
    </div>
  );
};

export default MistakeLog;
