import React, { useEffect, useState } from 'react';
import Header from '../components/header';
import './mutashabihat.css';

const Mutashabihat = () => {
  const [tilesData, setTilesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMutashabihat = async () => {
      try {
        const response = await fetch('http://localhost:5000/v1/surah/mutashabihat');
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          // Map: surahName => count of occurrences
          const surahCounts = {};

          json.data.forEach(entry => {
            const { source, matches } = entry;
            const name = source.surahName;

            if (!surahCounts[name]) {
              surahCounts[name] = 0;
            }

            surahCounts[name] += matches.length;
          });

          // Convert to array
          const result = Object.entries(surahCounts).map(([surah, count]) => ({
            surah,
            count,
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
  }, []);

  return (
    <div className="muta-container">
      <Header />

      <main className="muta-content">
        <h1 className="muta-heading">Mutashabihat</h1>
        <p className="muta-description">
          Each card below lists ayahs in that surah that are similar to any other ayah in Quran.
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="muta-tiles-grid">
            {tilesData.map((tile, index) => (
              <div key={index} className="muta-tile">
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
