import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './mistake-log.css';

const MistakeLog = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('http://localhost:5000/v1/recitation', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setSessions(data); // Adjust this if your API returns { data: [...] }
        console.log('✅ Mistake sessions:', data);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
    };

    fetchSessions();
  }, []);

  const handleMistakeClick = (surah, ayah, wordIndex) => {
    navigate('/quran', {
      state: { surah, ayahNumber: ayah, wordIndex },
    });
  };

  return (
    <div className="mistake-log-page">
      <header className="mistake-log-header">
        <span className="material-icons back-arrow" onClick={() => navigate('/')}>
          arrow_back
        </span>
        <h2>Mistakes Log</h2>
      </header>

      <div className="mistake-log-content">
        {sessions.length === 0 ? (
          <p>No recitation session with mistakes found.</p>
        ) : (
          sessions.map((session, i) => (
            <div key={session._id || i} className="session-block">
              <div className="session-header">
                <h4>Session {i + 1}</h4>
                <p>
                  Date: {new Date(session.sessionDate).toLocaleDateString()} <br />
                  Surah: {session.surahRange?.start?.surah ?? '?'}                                     |      Ayahs: {session.surahRange?.start?.ayah ?? '?'} - {session.surahRange?.end?.ayah ?? '?'}      |      Mistakes: {session.mistakes?.length ?? 0}
                </p>
              </div>

              <div className="mistake-buttons">
                {session.mistakes?.map((mistake, idx) => (
                  <button
                    key={idx}
                    className="mistake-word"
                    onClick={() =>
                      handleMistakeClick(mistake.surah, mistake.ayah, mistake.index)
                    }
                  >
                    {mistake.word}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MistakeLog;
