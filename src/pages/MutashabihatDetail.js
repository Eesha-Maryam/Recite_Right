import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MutashabihatDetail.css';
import { FaArrowLeft } from 'react-icons/fa';

const MutashabihatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ayahGroups, setAyahGroups] = useState([]);
  const [expandedAyahs, setExpandedAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
const toggleExpand = (index) => {
  setExpandedAyahs(prev =>
    prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
  );
};

  useEffect(() => {
    const fetchMutashabihat = async () => {
      try {
        const res = await fetch('http://localhost:5000/v1/surah/mutashabihat');
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const matchedData = json.data.filter(entry => entry.source.surah.toString() === id);

          const formattedGroups = matchedData.map(entry => ({
            sourceAyah: {
              surahId: entry.source.surah,
              surahName: entry.source.surahName,
              ayahNumber: entry.source.ayah,
              text: entry.source.arabic, // You can merge translation if needed
            },
            matches: entry.matches.map(m => ({
              surahName: m.surahName,
              ayahNumber: m.ayah,
              text: m.arabic, // Likewise, you can merge translation if desired
            })),
          }));

          setAyahGroups(formattedGroups);
        } else {
          console.error('Unexpected API response:', json);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMutashabihat();
  }, [id]);


  return (
    <div className="mutadetail-container">
      <div className="mutadetail-header">
        <button className="back-button" onClick={() => navigate('/mutashabihat')}>
          <FaArrowLeft className="back-icon" />
        </button>
        <h2 className="mutadetail-title">Mutashabihat</h2>
      </div>

      <main className="mutadetail-content detail-view">
        {loading ? (
          <p>Loading details...</p>
        ) : ayahGroups.length === 0 ? (
          <p>No similar ayahs found for this Surah.</p>
        ) : (
          <div className="mutadetail-ayah-group-list">
            <h3 className="mutadetail-surah-title">{ayahGroups[0]?.sourceAyah?.surahName}</h3>
            <div className="mutadetail-ayah-box">
              {ayahGroups.map((group, idx) => (
                <div key={idx} className="mutadetail-ayah-group">
                  <div
                    className="mutadetail-ayah-source-title"
                    onClick={() => toggleExpand(idx)}
                  >
                    <div className="mutadetail-ayah-number-circle">{group.sourceAyah.ayahNumber}</div>
                    <div className="mutadetail-ayah-text" dangerouslySetInnerHTML={{ __html: group.sourceAyah.text }} />
                  </div>

                  {expandedAyahs.includes(idx) && (
                    <ul className="mutadetail-similar-ayahs">
                      {group.matches.map((match, i) => (
                        <li key={i}>
                          <span className="mutadetail-match-surah">{match.surahName}</span> - Ayah {match.ayahNumber}:
                          <div className="mutadetail-match-text" dangerouslySetInnerHTML={{ __html: match.text }} />
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
