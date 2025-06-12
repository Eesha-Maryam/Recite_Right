import React from 'react';
import Header from '../components/header'; // Adjust path if needed
import './mutashabihat.css';

const tilesData = [
  { surah: 'Surah Al-Fatihah', count: 2 },
  { surah: 'Surah Al-Baqarah', count: 5 },
  { surah: 'Surah Al-Imran', count: 3 },
  { surah: 'Surah An-Nisa', count: 4 },
  { surah: 'Surah Al-Ma’idah', count: 2 },
  { surah: 'Surah Al-An’am', count: 3 },
  { surah: 'Surah Al-A’raf', count: 6 },
  { surah: 'Surah Al-Anfal', count: 1 },
  { surah: 'Surah At-Tawbah', count: 2 },
  { surah: 'Surah Yunus', count: 4 },
  { surah: 'Surah Hud', count: 3 },
  { surah: 'Surah Yusuf', count: 2 },
];

const Mutashabihat = () => {
  return (
    <div className="muta-container">
      <Header />

      <main className="muta-content">
        <h1 className="muta-heading">Mutashabihat</h1>
        <p className="muta-description">
          Each card below lists ayahs in that surah that are similar to any other ayah in Quran.
        </p>

        <div className="muta-tiles-grid">
          {tilesData.map((tile, index) => (
            <div key={index} className="muta-tile">
              <h3>{tile.surah}</h3>
              <p>Mutashabihat: {tile.count}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Mutashabihat;
