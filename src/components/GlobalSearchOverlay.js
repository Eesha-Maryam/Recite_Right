import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GlobalSearchOverlay.css';

const GlobalSearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [surahData, setSurahData] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const navigate = useNavigate();
  const baseUrl = process.env.REACT_APP_BASE_URL;

  // Fetch all Surahs once on open
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchSurahs = async () => {
      try {
        const res = await fetch(`${baseUrl}/v1/surah/dashboard`);
        const json = await res.json();
        const data = json.data || {};
        const formatted = Object.entries(data).map(([id, surah]) => ({
          id,
          title: surah.latin,
          subtitle: `(${surah.english})`
        }));
        setSurahData(formatted);
      } catch (err) {
        console.error('Error fetching surahs:', err);
        setSurahData([]);
      }
    };

    fetchSurahs();
  }, [isOpen, baseUrl]);

  // Filter results when user types
  useEffect(() => {
    if (!query.trim()) {
      setFilteredResults([]);
      return;
    }

    const results = surahData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredResults(results);
  }, [query, surahData]);

  if (!isOpen) return null;

return (
  <div className="global-search-overlay">
    <div className="global-search-box">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search Surah..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="close-button-search" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
      </div>

      {filteredResults.length > 0 && (
        <div className="search-results">
          {filteredResults.map((item) => (
            <div
              key={item.id}
              className="result-item"
              onClick={() => {
                navigate(`/quran?surahId=${item.id}`);
                setQuery('');
                onClose();
              }}
            >
              <strong>{item.title}</strong> – {item.subtitle}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

};

export default GlobalSearchOverlay;
