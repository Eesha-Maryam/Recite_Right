import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import './mutashabihat.css';

const Mutashabihat = () => {
  const [tilesData, setTilesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMutashabihat = async () => {
      try {
        const response = await fetch('http://localhost:5000/v1/surah/mutashabihat');
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          const surahCounts = {};
          const surahIds = {};

          json.data.forEach(entry => {
            const { source, matches } = entry;
            const name = source.surahName;
            const id = source.surahId;

            if (!surahCounts[name]) {
              surahCounts[name] = 0;
              surahIds[name] = id;
            }

            surahCounts[name] += matches.length;
          });

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
              <div
                key={index}
                className="muta-tile"
                onClick={() => navigate(`/mutashabihat/${tile.id}`)}
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
