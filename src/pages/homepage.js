import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import './homepage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const [, setHoveredTiles] = useState(new Set()); // Removed unused hoveredTiles
  const [activeTab, setActiveTab] = useState('Surah');
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const baseUrl = process.env.REACT_APP_BASE_URL;
  const [surahTiles, setSurahTiles] = useState([]);

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
    }, []);
  
  useEffect(() => {
    document.body.classList.add('homepage');
    return () => {
      document.body.classList.remove('homepage');
      document.body.style.overflowY = ''; // Reset on unmount
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
  // Removed unused isDesktop variable

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
      {/* Header is now absolutely positioned over the banner */}
      <Header transparent />
      
      {/* Banner Section - starts from top */}
      <div 
        className="banner-section" 
        style={{ 
          height: isVerySmallMobile ? '30vh' : isMobile ? '32vh' : '35vh',
          padding: isVerySmallMobile ? '12px' : isMobile ? '16px' : '20px'
        }}
      >
        <div 
          className="search-container"
          style={{
            width: isVerySmallMobile ? '90%' : isMobile ? '85%' : '70%',
            maxWidth: '500px',
            borderRadius: isVerySmallMobile ? '30px' : isMobile ? '35px' : '40px'
          }}
        >
          <span className="material-icons" style={{ 
            color: '#333333',
            fontSize: isVerySmallMobile ? '18px' : isMobile ? '20px' : '22px'
          }}>search</span>
          <input 
            type="text" 
            placeholder="What do you want to read?"
            style={{
              fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px',
              padding: isVerySmallMobile ? '8px 0' : '12px 0'
            }}
          />
          <span className="material-icons" style={{ 
            color: '#333333',
            fontSize: isVerySmallMobile ? '18px' : isMobile ? '20px' : '22px'
          }}>mic</span>
        </div>
      </div>

      <div className="content-container">
        {/* Content Section */}
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
      { title: "Correct Mistakes", content: "progress", align: "center" },
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
          fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : isTablet ? '14px' : '16px',
          textAlign: item.align,
          marginBottom: '12px'
        }}>{item.title}</h3>
        
        <div className="feature-content" style={{ 
          height: isTablet ? '60px' : 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          {item.content === "resume" && (
            <button 
              className="resume-button"
              style={{
                borderRadius: isVerySmallMobile ? '18px' : isMobile ? '20px' : '22px',
                padding: isVerySmallMobile ? '4px 10px' : isMobile ? '6px 12px' : '8px 16px',
                fontSize: isVerySmallMobile ? '10px' : isMobile ? '12px' : '14px',
                alignSelf: 'flex-start'
              }}
            >
              Resume
            </button>
          )}
          {item.content === "progress" && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="mistakes-bar-container" style={{ width: '100%', maxWidth: '200px' }}>
                <div className="mistakes-bar">
                  <div className="mistakes-progress" style={{ width: '80%' }}></div>
                </div>
                <div className="mistakes-count" style={{ 
                  fontSize: isVerySmallMobile ? '10px' : isMobile ? '11px' : '12px',
                  marginTop: '4px',
                  textAlign: 'center'
                }}>24/30</div>
              </div>
            </div>
          )}
          {item.content === "percentage" && (
            <p style={{
              color: '#97B469',
              fontSize: isVerySmallMobile ? '20px' : isMobile ? '22px' : '24px',
              textAlign: 'center',
              margin: '0 auto'
            }}>%</p>
          )}
          {item.content === "days" && (
            <p style={{
              color: '#97B469',
              fontSize: isVerySmallMobile ? '20px' : isMobile ? '22px' : '24px',
              textAlign: 'center',
              margin: '0 auto'
            }}>
              {user?.streak ?? 0} Days
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
</div>

        {/* Filter Section */}
        <div 
          className="filter-section"
          style={{
            width: isVerySmallMobile ? '95%' : isMobile ? '92%' : '88%',
            maxWidth: '900px',
            marginBottom: '16px'
          }}
        >
          <div className="tab-container">
          
          </div>
          <div className="sort-dropdown">
            <span style={{ fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px' }}>Sort by: </span>
            <select style={{ fontSize: isVerySmallMobile ? '12px' : isMobile ? '14px' : '16px' }}>
              <option>ASCENDING</option>
              <option>DESCENDING</option>
            </select>
          </div>
        </div>

        {/* Tile Section */}
        <div 
          className="tile-section"
          style={{
            padding: isVerySmallMobile ? '8px' : isMobile ? '10px' : '12px',
            width: isVerySmallMobile ? '95%' : isMobile ? '92%' : '88%',
            maxWidth: '900px',
            borderRadius: isVerySmallMobile ? '10px' : isMobile ? '12px' : '14px',
            borderWidth: isTablet ? '1.25px' : '1.5px',
            marginBottom: '40px' /* Added space before footer */
          }}
        >
          <div className="tile-grid">
            {(surahTiles.length > 0 ? surahTiles : []).map((tile, index) => (
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