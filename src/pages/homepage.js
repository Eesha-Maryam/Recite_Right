import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import './homepage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [avgProgressRate, setAvgProgressRate] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [, setHoveredTiles] = useState(new Set());
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [sortOrder, setSortOrder] = useState('ASCENDING');
  const [isResuming, setIsResuming] = useState(false);
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const [surahTiles, setSurahTiles] = useState([]);

  const getSortedTiles = () => {
    return [...surahTiles].sort((a, b) => {
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      return sortOrder === 'ASCENDING' ? idA - idB : idB - idA;
    });
  };

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`${baseUrl}/v1/recitation`);
        const sessions = await res.json();

        console.log('Sessions from backend:', sessions); // 👈 ADD THIS HERE

        const valid = sessions?.filter(s => typeof s.progressRate === 'number');
        const total = valid.reduce((sum, s) => sum + s.progressRate, 0);
        const avg = valid.length ? total / valid.length : 0;
        setAvgProgressRate(Math.round(avg));
      } catch (err) {
        console.error('Failed to fetch progress sessions:', err);
      }
    };

    fetchProgress();
  }, [baseUrl]);

  const resumeSession = async () => {
    setIsResuming(true);
    try {
      let session = null;

      // Check both backend and localStorage
      try {
        const res = await fetch(`${baseUrl}/api/recitation/last`);
        if (res.ok) session = await res.json();
      } catch (err) {
        console.log('Using localStorage fallback');
      }

      if (!session) {
        const local = localStorage.getItem('lastRecitation');
        if (local) session = JSON.parse(local);
      }

      if (session?.surahId) {
        // DEBUG: Check what's being loaded
        console.log('Resuming session:', session);

        // Use currentAyah if available, otherwise startAyah
        const ayahToResume = session.currentAyah || session.startAyah || 1;
        navigate(`/quran?surahId=${session.surahId}&startAyah=${ayahToResume}`);
      } else {
        alert('No session found. Please start a new recitation.');
      }
    } catch (error) {
      console.error('Resume failed:', error);
      alert('Failed to resume. Please try again.');
    } finally {
      setIsResuming(false);
    }
  };

  // Fetch API on mount
  useEffect(() => {
    fetch(`${baseUrl}/v1/surah/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        const response = data.data || {};
        const tiles = Object.entries(response).map(([key, value]) => ({
          id: key,
          title: value.latin,
          subtitle: `(${value.english})`
        }));
        setSurahTiles(tiles);
      })
      .catch((err) => {
        console.error('Error fetching Surahs:', err);
      });
  }, [baseUrl]);

  useEffect(() => {
    document.body.classList.add('homepage');
    return () => {
      document.body.classList.remove('homepage');
      document.body.style.overflowY = '';
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Screen size helpers
  const isVerySmallMobile = windowSize.width <= 350;
  const isMobile = windowSize.width < 600;
  const isTablet = windowSize.width >= 600 && windowSize.width < 900;

  const handleTileHover = (tile, isHovering) => {
    setHoveredTiles(prev => {
      const newSet = new Set(prev);
      isHovering ? newSet.add(tile) : newSet.delete(tile);
      return newSet;
    });
  };

  const handleTileClick = (surahId) => {
    navigate(`/quran?surahId=${surahId}`);
  };

  return (
    <div className="home-page">
      <Header transparent />

      <div
        className="banner-section"
        style={{
          height: isVerySmallMobile ? '30vh' : isMobile ? '32vh' : '35vh',
          padding: isVerySmallMobile ? '12px' : isMobile ? '16px' : '20px'
        }}
      >
        <div className="search-wrapper">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search the Surah..."
              value={searchTerm}
              onChange={(e) => {
                const term = e.target.value;
                setSearchTerm(term);
                const results = surahTiles.filter(item =>
                  item.title.toLowerCase().includes(term.toLowerCase()) ||
                  item.subtitle.toLowerCase().includes(term.toLowerCase())
                );
                setSearchResults(results);
              }}
              style={{
                fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px',
                padding: isVerySmallMobile ? '8px 12px 8px 36px' : '12px 12px 12px 42px'
              }}
            />
            <span
              className="material-icons search-icon"
              style={{
                fontSize: isVerySmallMobile ? '18px' : isMobile ? '20px' : '22px',
                left: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px'
              }}
            >
              search
            </span>

            {searchTerm && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map(item => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                      navigate(`/quran?surahId=${item.id}`);
                    }}
                  >
                    <strong>{item.title}</strong> – {item.subtitle}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content-container">
        <div className="content-section"
          style={{
            margin: isVerySmallMobile ? '12px 16px' : isMobile ? '16px 20px' : '24px auto',
            padding: isVerySmallMobile ? '10px' : isMobile ? '12px' : '16px',
            width: 'calc(100% - 32px)',
            maxWidth: '900px',
            borderRadius: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px'
          }}
        >
          <div className="grid-container">
            {[
              { title: "Continue where you left off", content: "resume", align: "left" },
              { title: "Review & Fix Your Recitation", content: "progress", align: "center" },
              { title: "Progress Rate", content: "percentage", align: "center" },
              { title: "Streaks", content: "days", align: "center" }
            ].map((item, index) => (
              <div
                key={index}
                className="feature-box"
                style={{
                  padding: isVerySmallMobile ? '8px' : isMobile ? '10px' : isTablet ? '10px' : '12px',
                  borderRadius: isVerySmallMobile ? '10px' : isMobile ? '12px' : isTablet ? '12px' : '14px',
                }}
              >
                <h3 style={{
                  fontSize: isVerySmallMobile ? '13px' : isMobile ? '15px' : isTablet ? '16px' : '18px',
                  textAlign: item.align,
                  marginBottom: '12px',
                  marginTop: '5px',
                }}>{item.title}</h3>

                <div className="feature-content" style={{
                  height: isTablet ? '60px' : 'auto',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start', // changed from 'flex-end' to push content upward
                  alignItems: 'center'
                }}>
                  {item.content === "resume" && (
                    <button
                      className="resume-button"
                      style={{
                        borderRadius: isVerySmallMobile ? '18px' : isMobile ? '20px' : '22px',
                        padding: isVerySmallMobile ? '4px 10px' : isMobile ? '6px 12px' : '8px 16px',
                        fontSize: isVerySmallMobile ? '10px' : isMobile ? '12px' : '14px',
                        marginTop: '11px', // moves button a bit up
                        alignSelf: 'flex-start',
                      }}
                      onClick={resumeSession}
                      disabled={isResuming}
                    >
                      {isResuming ? 'Loading...' : 'Resume'}
                    </button>
                  )}

                  {item.content === "progress" && (
                    <div
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginTop: '11px' // moves text slightly up
                      }}
                      onClick={() => navigate('/mistake-log')}
                    >
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: '#97B469',
                          fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '30px',
                          transition: 'color 0.3s ease',
                        }}
                        onClick={() => navigate('/mistake-log')}
                        onMouseEnter={e => e.target.style.color = '#6B8E23'} // darker olive
                        onMouseLeave={e => e.target.style.color = '#97B469'} // original olive
                      >
                        Mistakes
                      </span>

                    </div>
                  )}

                  {item.content === "percentage" && (
                    <div>
                      <span className="progress-number">{avgProgressRate !== null ? `${avgProgressRate}` : '...'}</span>
                      <span className="progress-percent">%</span>
                    </div>
                  )}


                  {item.content === "days" && (
                    <div className="streak-wrapper">
                      <span className="streak-number">{user?.streak ?? 0}</span>
                      <span className="streak-label">Days</span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

        <div
          className="filter-section"
          style={{
            width: isVerySmallMobile ? '95%' : isMobile ? '92%' : '88%',
            maxWidth: '900px',
            marginBottom: '16px'
          }}
        >
          <div className="tab-container"></div>
          <div className="sort-dropdown">
            <span style={{ fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px' }}>Sort by: </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px',
                border: '1px solid #97B469',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ASCENDING">Ascending</option>
              <option value="DESCENDING">Descending</option>
            </select>
          </div>
        </div>

        <div
          className="tile-section"
          style={{
            padding: isVerySmallMobile ? '8px' : isMobile ? '10px' : '12px',
            width: isVerySmallMobile ? '95%' : isMobile ? '92%' : '88%',
            maxWidth: '900px',
            borderRadius: isVerySmallMobile ? '10px' : isMobile ? '12px' : '14px',
            borderWidth: isTablet ? '1.25px' : '1.5px',
            marginBottom: '40px'
          }}
        >
          <div className="tile-grid">
            {(getSortedTiles().length > 0 ? getSortedTiles() : []).map((tile, index) => (
              <div
                key={index}
                className="tile"
                data-surah-id={tile.id}
                onClick={() => handleTileClick(tile.id)}
                onMouseEnter={() => handleTileHover(tile.title, true)}
                onMouseLeave={() => handleTileHover(tile.title, false)}
                style={{
                  borderRadius: isVerySmallMobile ? '8px' : isMobile ? '10px' : '12px',
                  borderWidth: isTablet ? '1.25px' : '1.5px'
                }}
              >
                <h4 style={{ fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px' }}>{tile.title}</h4>
                <p style={{ fontSize: isVerySmallMobile ? '10px' : isMobile ? '12px' : '14px' }}>{tile.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;