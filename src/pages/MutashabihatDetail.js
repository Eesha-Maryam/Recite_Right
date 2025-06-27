import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MutashabihatDetail.css';
import { FaArrowLeft } from 'react-icons/fa';
import DOMPurify from 'dompurify';

/**
 * MutashabihatDetail Component - Displays detailed view of similar Quranic verses (mutashabihat)
 * for a specific Surah. Features include:
 * - Expandable/collapsible verse groups
 * - Word-by-word highlighting of similarities
 * - Sanitized HTML rendering for security
 * - Responsive design with loading/error states
 */
const MutashabihatDetail = () => {
  // Router hooks
  const { id } = useParams(); // Get Surah ID from URL params
  const navigate = useNavigate(); // Navigation function

  // Component state
  const [ayahGroups, setAyahGroups] = useState([]); // Stores grouped verse data
  const [expandedAyahs, setExpandedAyahs] = useState([]); // Tracks expanded verses
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  /**
   * Toggles expansion state for a verse group
   * @param {number} index - Index of the verse group to toggle
   */
  const toggleExpand = (index) => {
    setExpandedAyahs(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Fetch data on component mount or when Surah ID changes
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

        // Process API response
        if (json.success && Array.isArray(json.data)) {
          // Filter data for current Surah only
          const matchedData = json.data.filter(entry => 
            entry?.source?.surah?.toString() === id
          );

          if (matchedData.length === 0) {
            console.warn('No matching data found for surah:', id);
          }

          // Format data for display
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

  /**
   * Sanitizes HTML content to prevent XSS attacks
   * @param {string} html - Raw HTML content
   * @returns {string} Sanitized HTML
   */
  const sanitizeHtml = (html) => {
    try {
      return DOMPurify.sanitize(html);
    } catch (err) {
      console.error('Error sanitizing HTML:', err);
      return 'Invalid text content';
    }
  };

  /**
   * Highlights similar words between source and match verses
   * @param {string} sourceText - Original verse text
   * @param {string} matchText - Similar verse text
   * @returns {Object} Contains highlighted source and match texts
   */
  const highlightSimilarWords = (sourceText, matchText) => {
    try {
      // Normalize Arabic text by removing diacritics and non-Arabic characters
      const cleanSourceWords = sourceText
        .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics
        .replace(/[^\u0600-\u06FF\s]/g, '') // Keep only Arabic letters and whitespace
        .split(/\s+/)
        .filter(word => word.length > 0);

      const cleanMatchWords = matchText
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[^\u0600-\u06FF\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0);

      // Find common words between verses
      const commonWords = new Set(
        cleanSourceWords.filter(word => cleanMatchWords.includes(word))
      );

      // Highlight matching words in text
      const highlightWords = (text) => {
        return text.replace(
          /([\u0600-\u06FF]+)/g,
          (word) => {
            const cleanWord = word.replace(/[\u064B-\u065F\u0670]/g, '');
            return commonWords.has(cleanWord) 
              ? `<span class="golden-word">${word}</span>` 
              : word;
          }
        );
      };

      return {
        source: highlightWords(sourceText),
        match: highlightWords(matchText),
      };
    } catch (err) {
      console.error('Highlighting error:', err);
      return {
        source: sourceText,
        match: matchText,
      };
    }
  };

  /**
   * Renders a verse group with expandable matches
   * @param {Object} group - Verse group data
   * @param {number} idx - Group index
   * @returns {JSX} Rendered verse group component
   */
  const renderAyahGroup = (group, idx) => {
    const sourceText = group.sourceAyah.text;
    
    return (
      <div 
        key={`group-${idx}`} 
        className={`mutadetail-ayah-group ${expandedAyahs.includes(idx) ? 'expanded' : ''}`}
      >
        {/* Clickable verse header */}
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
          <div 
            className="mutadetail-ayah-text arabic-text" 
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(
                expandedAyahs.includes(idx) 
                  ? highlightSimilarWords(sourceText, group.matches[0]?.text || '').source
                  : sourceText
              ) 
            }} 
          />
        </div>

        {/* Expanded content - similar verses */}
        {expandedAyahs.includes(idx) && (
          <ul className="mutadetail-similar-ayahs">
            {group.matches.map((match, i) => {
              const highlightedTexts = highlightSimilarWords(sourceText, match.text);
              return (
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
                  <div 
                    className="mutadetail-match-text arabic-text"
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeHtml(highlightedTexts.match) 
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  // Main component render
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
            {ayahGroups.map((group, idx) => renderAyahGroup(group, idx))}
          </div>
        </div>
      )}
    </main>
  </div>
);
};

export default MutashabihatDetail;