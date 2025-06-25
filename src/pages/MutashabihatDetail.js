import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MutashabihatDetail.css';
import { FaArrowLeft } from 'react-icons/fa';
import DOMPurify from 'dompurify'; // For HTML sanitization

const MutashabihatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ayahGroups, setAyahGroups] = useState([]);
  const [expandedAyahs, setExpandedAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleExpand = (index) => {
    setExpandedAyahs(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    const fetchMutashabihat = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('http://localhost:5000/v1/surah/mutashabihat');
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        console.log('API Response:', json);

        if (json.success && Array.isArray(json.data)) {
          const matchedData = json.data.filter(entry => 
            entry?.source?.surah?.toString() === id
          );

          if (matchedData.length === 0) {
            console.warn('No matching data found for surah:', id);
          }

          const formattedGroups = matchedData.map(entry => ({
            sourceAyah: {
              surahId: entry.source?.surah || 0,
              surahName: entry.source?.surahName || 'Unknown Surah',
              ayahNumber: entry.source?.ayah || 0,
              text: entry.source?.arabic || 'No text available',
            },
            matches: (entry.matches || []).map(m => ({
              surahName: m?.surahName || 'Unknown Surah',
              ayahNumber: m?.ayah || 0,
              text: m?.arabic || 'No text available',
            })),
          }));

          setAyahGroups(formattedGroups);
        } else {
          console.error('Unexpected API response format:', json);
          setError('Invalid data format received from server');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMutashabihat();
  }, [id]);

  const sanitizeHtml = (html) => {
    try {
      return DOMPurify.sanitize(html);
    } catch (err) {
      console.error('Error sanitizing HTML:', err);
      return 'Invalid text content';
    }
  };

  const renderAyahText = (text) => {
    if (!text) return <span className="text-missing">No text available</span>;
    
    return (
      <div 
        className="arabic-text" 
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} 
      />
    );
  };

  return (
    <div className="mutadetail-container">
      <div className="mutadetail-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/mutashabihat')}
          aria-label="Go back"
        >
          <FaArrowLeft className="back-icon" />
        </button>
        <h2 className="mutadetail-title">Mutashabihat</h2>
      </div>

      <main className="mutadetail-content detail-view">
        {loading ? (
          <div className="loading-indicator">
            <p>Loading details...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : ayahGroups.length === 0 ? (
          <div className="no-results">
            <p>No similar ayahs found for this Surah.</p>
          </div>
        ) : (
          <div className="mutadetail-ayah-group-list">
            <h3 className="mutadetail-surah-title">
              {ayahGroups[0]?.sourceAyah?.surahName || 'Unknown Surah'}
            </h3>
            <div className="mutadetail-ayah-box">
              {ayahGroups.map((group, idx) => (
                <div 
                  key={`group-${idx}`} 
                  className={`mutadetail-ayah-group ${expandedAyahs.includes(idx) ? 'expanded' : ''}`}
                >
                  <div
                    className="mutadetail-ayah-source-title"
                    onClick={() => toggleExpand(idx)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expandedAyahs.includes(idx)}
                  >
                    <div className="mutadetail-ayah-number-circle">
                      {group.sourceAyah.ayahNumber}
                    </div>
                    <div className="mutadetail-ayah-text">
                      {renderAyahText(group.sourceAyah.text)}
                    </div>
                  </div>

                  {expandedAyahs.includes(idx) && (
                    <ul className="mutadetail-similar-ayahs">
                      {group.matches.map((match, i) => (
                        <li key={`match-${idx}-${i}`} className="similar-ayah-item">
                          <div className="match-header">
                            <span className="mutadetail-match-surah">
                              {match.surahName}
                            </span>
                            <span className="ayah-separator"> - </span>
                            <span className="mutadetail-match-ayah">
                              Ayah {match.ayahNumber}:
                            </span>
                          </div>
                          <div className="mutadetail-match-text">
                            {renderAyahText(match.text)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MutashabihatDetail;