import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import './mutashabihat.css';

/**
 * Mutashabihat Component - Displays a grid of Surah tiles showing counts of similar verses (mutashabihat)
 * Features:
 * - Fetches mutashabihat data from backend API
 * - Displays each Surah with count of similar verses
 * - Navigates to detail view when a tile is clicked
 */
const Mutashabihat = () => {
  // State management
  const [tilesData, setTilesData] = useState([]); // Stores processed Surah data
  const [loading, setLoading] = useState(true);   // Loading state for API call
  const navigate = useNavigate();                // Router navigation hook

  /**
   * Fetches and processes mutashabihat data on component mount
   */
  useEffect(() => {
    const fetchMutashabihat = async () => {
      try {
        // Fetch data from backend API
        const response = await fetch('http://localhost:5000/v1/surah/mutashabihat');
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          // Process data to count mutashabihat per Surah
          const surahCounts = {}; // Stores count of similar verses per Surah
          const surahIds = {};    // Maps Surah names to their IDs

          json.data.forEach(entry => {
            const { source, matches } = entry;
            const name = source.surahName;
            const id = source.surah;

            // Initialize count and ID tracking for new Surahs
            if (!surahCounts[name]) {
              surahCounts[name] = 0;
              surahIds[name] = id;
            }

            // Increment count by number of matches found
            surahCounts[name] += matches.length;
          });

          // Transform data into array format for rendering
          const result = Object.entries(surahCounts).map(([surah, count]) => ({
            surah,
            count,
            id: surahIds[surah],
          }));

          setTilesData(result);
        } else {
          console.error('Unexpected response format:', json);
        }
      } catch (error) {
        console.error('Error fetching mutashabihat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMutashabihat();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="muta-container">
      <Header />

      <main className="muta-content">
        {/* Page header and description */}
        <h1 className="muta-heading">Mutashabihat</h1>
        <p className="muta-description">
          Each card below lists ayahs in that surah that are similar to any other ayah in Quran.
        </p>

        {/* Conditional rendering based on loading state */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="muta-tiles-grid">
            {/* Render each Surah as a clickable tile */}
            {tilesData.map((tile, index) => (
              <div
                key={index}
                className="muta-tile"
                onClick={() => navigate(`/mutashabihat/${tile.id}`)}
                role="button" // Improves accessibility
                tabIndex={0}  // Makes tile focusable
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/mutashabihat/${tile.id}`)}
              >
                <h3>{tile.surah}</h3>
                <p>Mutashabihat: {tile.count}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Mutashabihat;