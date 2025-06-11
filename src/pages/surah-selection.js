 import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/header';
import { FaSearch, FaPlus, FaMinus, FaEdit, FaTrash } from 'react-icons/fa';
import './surah-selection.css';

const SurahSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const testMode = location.state?.testMode || 'easy';

  const [selectedSurahs, setSelectedSurahs] = useState([]);
  const [expandedSurah, setExpandedSurah] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rangeValues, setRangeValues] = useState({});
  const [fullQuranChecked, setFullQuranChecked] = useState(false);
  const [surahs, setSurahs] = useState([]);

  const baseUrl = process.env.REACT_APP_BASE_URL;

   useEffect(() => {
    const fetchSurahList = async () => {
      try {
        const response = await fetch(`${baseUrl}/v1/surah/dashboard`);
        const result = await response.json();

        if (result.success && result.data) {
          const formattedList = Object.entries(result.data).map(([number, details]) => ({
            id: parseInt(number),
            name: `${details.arabic}`,
            ayahs: details.ayah
          }));

          setSurahs(formattedList);

        } else {
          console.error('Unexpected API response format:', result);
        }
      } catch (error) {
        console.error('Failed to fetch surah list:', error);
      }
    };

    fetchSurahList();
  }, []);

  useEffect(() => {
    if (fullQuranChecked) {
      const allSurahs = surahs.map(surah => ({
        ...surah,
        startAyah: 1,
        endAyah: surah.ayahs
      }));
      setSelectedSurahs(allSurahs);

      const allRanges = {};
      surahs.forEach(surah => {
        allRanges[surah.id] = { start: 1, end: surah.ayahs };
      });
      setRangeValues(allRanges);
    } else {
      setSelectedSurahs([]);
      setRangeValues({});
    }
    setExpandedSurah(null);
  }, [fullQuranChecked]);

  const filteredSurahs = surahs.filter(surah =>
    surah.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSurahSelection = (surah) => {
    if (fullQuranChecked) return;

    if (selectedSurahs.some(s => s.id === surah.id)) {
      setSelectedSurahs(selectedSurahs.filter(s => s.id !== surah.id));
      setExpandedSurah(null);
    } else {
      setSelectedSurahs([...selectedSurahs, {
        ...surah,
        startAyah: 1,
        endAyah: surah.ayahs
      }]);
      setRangeValues(prev => ({
        ...prev,
        [surah.id]: { start: 1, end: surah.ayahs }
      }));
      setExpandedSurah(surah.id);
    }
  };

  const saveRange = (surahId) => {
    setSelectedSurahs(selectedSurahs.map(surah =>
      surah.id === surahId
        ? {
            ...surah,
            startAyah: rangeValues[surahId]?.start || 1,
            endAyah: rangeValues[surahId]?.end || surah.ayahs
          }
        : surah
    ));
    setExpandedSurah(null);
  };

  const handleRangeChange = (surahId, field, value) => {
    setRangeValues(prev => ({
      ...prev,
      [surahId]: {
        ...prev[surahId],
        [field]: Math.max(1, Math.min(value, surahs.find(s => s.id === surahId).ayahs))
      }
    }));
  };

  const updateRange = (surahId, field, delta) => {
    const surah = surahs.find(s => s.id === surahId);
    const currentValue = rangeValues[surahId]?.[field] ||
      (field === 'start' ? 1 : surah.ayahs);

    const newValue = currentValue + delta;
    const maxValue = field === 'start'
      ? Math.min(rangeValues[surahId]?.end || surah.ayahs, surah.ayahs)
      : surah.ayahs;

    const minValue = field === 'end'
      ? Math.max(rangeValues[surahId]?.start || 1, 1)
      : 1;

    const clampedValue = Math.max(minValue, Math.min(newValue, maxValue));
    handleRangeChange(surahId, field, clampedValue);
  };

  const removeSurah = (surahId) => {
    setSelectedSurahs(selectedSurahs.filter(s => s.id !== surahId));
    const updatedRanges = { ...rangeValues };
    delete updatedRanges[surahId];
    setRangeValues(updatedRanges);
  };

  const clearAll = () => {
    setSelectedSurahs([]);
    setRangeValues({});
    setExpandedSurah(null);
    setFullQuranChecked(false);
  };

  const handleStartQuiz = async () => {
  const quizData = {
    testMode: fullQuranChecked ? 'full' : testMode,
    selectedSurahs: fullQuranChecked
      ? surahs.map(s => ({
          id: s.id,
          name: s.name,
          startAyah: 1,
          endAyah: s.ayahs
        }))
      : selectedSurahs
  };

  try {
    // Pass the backend response if needed
    navigate('/quiz', {
      state: {
        selectedSurahs: quizData.selectedSurahs,
        testMode: quizData.testMode,
      }
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    alert('There was an error setting up your quiz. Please try again.');
  }
};


  return (
    <div className="surah-selection">
      <Header />

      <div className="selection-container">
        {/* Right Half */}
        <div className="right-half">
          <h2 className="setup-title">Quran Test Setup</h2>
          <p className="setup-description">
            Test Mode: <strong>{testMode.charAt(0).toUpperCase() + testMode.slice(1)}</strong>
          </p>

          <div className="selected-surahs-block">
            <h3 className="selected-title">Selected Surahs & Ayah Range</h3>

            {selectedSurahs.length === 0 ? (
              <div className="empty-state">No Surah Selected</div>
            ) : (
              <div className="selected-list">
                {selectedSurahs.map((surah, index) => (
                  <div key={index} className="selected-item">
                    <div className="surah-info">
                      <span className="surah-name">{surah.name}</span>
                      <span className="ayah-range">
                        Ayah {surah.startAyah} to {surah.endAyah}
                      </span>
                    </div>
                    {!fullQuranChecked && (
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => setExpandedSurah(surah.id)}>
                          <FaEdit />
                        </button>
                        <button className="delete-btn" onClick={() => removeSurah(surah.id)}>
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="action-buttons-row">
              <button className="clear-btn" onClick={clearAll} disabled={selectedSurahs.length === 0}>
                Clear All
              </button>
              <button className="start-quiz-btn" disabled={selectedSurahs.length === 0} onClick={handleStartQuiz}>
                Start Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Left Half */}
        <div className="left-half">
          <div className="full-quran-checkbox">
            <input
              type="checkbox"
              id="fullQuran"
              checked={fullQuranChecked}
              onChange={() => setFullQuranChecked(prev => !prev)}
            />
            <label htmlFor="fullQuran"><strong>Full Quran Test</strong></label>
            <p className="full-quran-text">Check to take a test of the entire Quran</p>
          </div>

          <div className="surah-list-block">
            <div className="search-header">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Surah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={fullQuranChecked}
              />
            </div>

            <div className="surah-list">
              {filteredSurahs.map(surah => (
                <div key={surah.id} className="surah-item">
                  <div className="surah-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSurahs.some(s => s.id === surah.id)}
                      disabled={fullQuranChecked}
                      onChange={() => toggleSurahSelection(surah)}
                    />
                    <span className="surah-name" onClick={() => toggleSurahSelection(surah)}>
                      {surah.name}
                    </span>
                  </div>

                  {!fullQuranChecked && expandedSurah === surah.id && (
                    <div className="range-selection">
                      <h4>Select Surah Range</h4>
                      <div className="range-controls">
                        <div className="range-field">
                          <label>Start Ayah</label>
                          <div className="range-input">
                            <button onClick={() => updateRange(surah.id, 'start', -1)}><FaMinus /></button>
                            <input
                              type="number"
                              value={rangeValues[surah.id]?.start || 1}
                              onChange={(e) =>
                                handleRangeChange(surah.id, 'start', parseInt(e.target.value) || 1)
                              }
                              min="1"
                              max={rangeValues[surah.id]?.end || surah.ayahs}
                            />
                            <button onClick={() => updateRange(surah.id, 'start', 1)}><FaPlus /></button>
                          </div>
                        </div>

                        <div className="range-field">
                          <label>End Ayah</label>
                          <div className="range-input">
                            <button onClick={() => updateRange(surah.id, 'end', -1)}><FaMinus /></button>
                            <input
                              type="number"
                              value={rangeValues[surah.id]?.end || surah.ayahs}
                              onChange={(e) =>
                                handleRangeChange(surah.id, 'end', parseInt(e.target.value) || surah.ayahs)
                              }
                              min={rangeValues[surah.id]?.start || 1}
                              max={surah.ayahs}
                            />
                            <button onClick={() => updateRange(surah.id, 'end', 1)}><FaPlus /></button>
                          </div>
                        </div>
                      </div>

                      <button className="save-range-btn" onClick={() => saveRange(surah.id)}>
                        Save Range
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurahSelection;
