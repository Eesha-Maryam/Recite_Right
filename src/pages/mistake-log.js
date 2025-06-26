import React from 'react';
import { useNavigate } from 'react-router-dom';
import './mistake-log.css';

// Dummy session data, structured like real use-case
const dummySessions = [
  {
    sessionId: 1,
    date: '12th Jan 2025',
    timeRange: '10:00 AM - 10:12 AM',
    surah: 'Al-Baqarah',
    ayahs: '1 - 10',
    mistakes: [
      { word: 'قَوْلُهُمْ', ayahNumber: 2, wordIndex: 5, isCorrected: false },
      { word: 'مُّفْسِدُونَ', ayahNumber: 4, wordIndex: 2, isCorrected: true },
      { word: 'يُؤْمِنُونَ', ayahNumber: 3, wordIndex: 7, isCorrected: false },
      { word: 'الصَّلَاةَ', ayahNumber: 2, wordIndex: 9, isCorrected: false }
    ]
  },
  {
    sessionId: 2,
    date: '13th Jan 2025',
    timeRange: '4:00 PM - 4:08 PM',
    surah: 'Hud',
    ayahs: '1 - 5',
    mistakes: [
      { word: 'تَفَاوُتٍ', ayahNumber: 3, wordIndex: 6, isCorrected: false },
      { word: 'الزُّخْرُفِ', ayahNumber: 4, wordIndex: 3, isCorrected: false }
    ]
  },
  {
    sessionId: 3,
    date: '14th Jan 2025',
    timeRange: '9:30 AM - 9:45 AM',
    surah: 'Al-Imran',
    ayahs: '1 - 15',
    mistakes: [
      { word: 'الْمُفْسِدُ', ayahNumber: 5, wordIndex: 2, isCorrected: false },
      { word: 'الْكِتَابَ', ayahNumber: 6, wordIndex: 4, isCorrected: true },
      { word: 'مُّخْتَلِفَاتٍ', ayahNumber: 7, wordIndex: 5, isCorrected: false },
      { word: 'الذِّكْرِ', ayahNumber: 8, wordIndex: 3, isCorrected: true },
    ]
  }
];

const MistakeLog = () => {
  const navigate = useNavigate();

  const handleMistakeClick = (surah, ayahNumber, wordIndex) => {
    // Simulate navigation to Quran page with highlight info
    navigate('/quran', {
      state: { surah, ayahNumber, wordIndex }
    });
  };

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
        {dummySessions.map(session => (
          <div key={session.sessionId} className="session-block">
            <div className="session-header">
              <h4>Session {session.sessionId}</h4>
              <p>
                Date: {session.date} | Time: {session.timeRange} <br />
                Surah: {session.surah} | Ayahs: {session.ayahs} | Mistakes: {session.mistakes.length}
              </p>
            </div>
            <div className="mistake-buttons">
              {session.mistakes.map((mistake, i) => (
                <button
                  key={i}
                  className={`mistake-word ${mistake.isCorrected ? 'corrected' : ''}`}
                  onClick={() => handleMistakeClick(session.surah, mistake.ayahNumber, mistake.wordIndex)}
                >
                  {mistake.word}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MistakeLog;
