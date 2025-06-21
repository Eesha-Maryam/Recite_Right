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
  // 🚧 TEMP: Commenting out actual API call for dummy testing
  /*
  const fetchMutashabihat = async () => {
    try {
      const res = await fetch('http://localhost:5000/v1/surah/mutashabihat');
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const matchedData = json.data.filter(entry => entry.source.surahId.toString() === id);

        const formattedGroups = matchedData.map(entry => ({
          sourceAyah: entry.source,
          matches: entry.matches,
        }));

        setAyahGroups(formattedGroups);
      } else {
        console.error('Unexpected format:', json);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchMutashabihat();
  */

  
  // ✅ Using Dummy Data
  const dummyData = [
    {
      sourceAyah: {
        surahId: 2,
        surahName: "Surah Al-Baqarah",
        ayahNumber: 2,
        text: "ذَٰلِكَ <span class='highlight'>ٱلۡكِتَٰبُ</span> لَا رَيۡبَ ۛ فِيهِ ۛ هُدٗى لِّلۡمُتَّقِينَ"
      },
      matches: [
        {
          surahName: "Surah Aal-e-Imran",
          ayahNumber: 138,
          text: "هَٰذَا بَيَانٌ لِّلنَّاسِ وَ<span class='highlight'>هُدٗى</span> وَمَوْعِظَةٞ لِّلۡمُتَّقِينَ"
        },
        {
          surahName: "Surah Ash-Shu’ara",
          ayahNumber: 2,
          text: "تِلْكَ آيَاتُ <span class='highlight'>ٱلۡكِتَٰبِ</span> ٱلۡمُبِينِ"
        }
      ]
    },
    {
      sourceAyah: {
        surahId: 2,
        surahName: "Surah Al-Baqarah",
        ayahNumber: 13,
        text: "وَإِذَا قِيلَ لَهُمۡ ءَامِنُواْ كَمَآ ءَامَنَ <span class='highlight'>ٱلنَّاسُ</span>"
      },
      matches: [
        {
          surahName: "Surah Az-Zukhruf",
          ayahNumber: 2,
          text: "إِنَّا جَعَلۡنَٰهُ قُرۡءَانٗا <span class='highlight'>عَرَبِيّٗا</span> لَّعَلَّكُمۡ تَعۡقِلُونَ"
        },
        {
          surahName: "Surah Hud",
          ayahNumber: 1,
          text: "كِتَٰبٌ أُحۡكِمَتۡ <span class='highlight'>ءَايَاتُهُۥ</span> ثُمَّ فُصِّلَتۡ"
        }
      ]
    }
  ];

  setAyahGroups(dummyData);
  setLoading(false);
}, []);


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
