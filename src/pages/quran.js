import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaMicrophone, FaChevronDown, FaEye, FaEyeSlash, FaBars, FaTimes } from 'react-icons/fa';
import Header from '../components/header';
import './Quran.css';

const SettingsItem = ({ icon, text }) => {
  const getIcon = () => {
    switch (icon) {
      case 'eye':
        return <FaEye />;
      case 'mic':
        return <FaMicrophone />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-item">
      <div className="settings-icon">{getIcon()}</div>
      <div className="settings-text">{text}</div>
    </div>
  );
};

const ToggleWithDescription = ({ description, isOn, onToggle, option1, option2 }) => {
  return (
    <div className="toggle-component-quran">
      <div className="toggle-container-quran" onClick={onToggle}>
        <div className={`toggle-option-quran ${isOn ? 'selected' : ''}`}>
          {option1}
        </div>
        <div className={`toggle-option-quran ${!isOn ? 'selected' : ''}`}>
          {option2}
        </div>
      </div>
    </div>
  );
};

const HideUnhideToggle = ({ isHidden, onToggle }) => {
  return (
    <div>
      <ToggleWithDescription
        isOn={!isHidden}
        onToggle={onToggle}
        option1="SHOW"
        option2="HIDE"
      />
    </div>
  );
};

function useQuery() {
  const location = useLocation();
  return new URLSearchParams(location.search);
}

const Quran = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [startAyah, setStartAyah] = useState('');
  const [ayahs, setAyahs] = useState([]);
  const [textHidden, setTextHidden] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [readAyahs, setReadAyahs] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAyah, setCurrentAyah] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [highlightedAyah, setHighlightedAyah] = useState(null);
  const [recordingData, setRecordingData] = useState([]);
  const [surahList, setSurahList] = useState([]);
  const [readyToRecite, setReadyToRecite] = useState(false);
  const isReciteDisabled = !selectedSurah;
  const baseUrl = process.env.REACT_APP_BASE_URL;

  // Refs
  const ayahRefs = useRef({});
  const dropdownRef = useRef(null);
  const quranBlockRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const beepSoundRef = useRef(null);

  // Dummy Quran Data (expanded for Juz 30)
  const dummyQuranData = {
    78: Array.from({ length: 40 }, (_, i) => ({ 
      number: i + 1, 
      text: 'عَمَّ يَتَسَآءَلُونَ عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ كَلَّا سَيَعْلَمُونَ ثُمَّ كَلَّا سَيَعْلَمُونَ أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَٰدًا وَٱلْجِبَالَ أَوْتَادًا وَخَلَقْنَٰكُمْ أَزْوَٰجًا وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا وَجَعَلْنَا ٱلَّيْلَ لِبَاسًا وَجَعَلْنَا ٱلنَّهَارَ مَعَاشًا وَبَنَيْنَا فَوْقَكُمْ سَبْعًا شِدَادًا وَجَعَلْنَا سِرَاجًا وَهَّاجًا وَأَنزَلْنَا مِنَ ٱلْمُعْصِرَٰتِ مَآءً ثَجَّاجًا لِّنُخْرِجَ بِهِۦ حَبًّا وَنَبَاتًا وَجَنَّٰتٍ أَلْفَافًا'
        .split(' ').slice(0, 30 + Math.floor(Math.random() * 10)).join(' ')
    })),
    114: [
      { number: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ' },
      { number: 2, text: 'مَلِكِ ٱلنَّاسِ' },
      { number: 3, text: 'إِلَـٰهِ ٱلنَّاسِ' },
      { number: 4, text: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ' },
      { number: 5, text: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ' },
      { number: 6, text: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ' }
    ]
  };

  useEffect(() => {
    const fetchSurahList = async () => {
      try {
        const response = await fetch(`${baseUrl}/v1/surah/dashboard`);
        const result = await response.json();

        if (result.success && result.data) {
          const formattedList = Object.entries(result.data).map(([number, details]) => ({
            number: parseInt(number),
            name: `${details.latin} (${details.english})`
          }));

          setSurahList(formattedList);

          if (formattedList.length > 0 && !selectedSurah) {
            const query = new URLSearchParams(window.location.search);
            const surahParam = query.get('surahId');
            const surahNumber = surahParam ? parseInt(surahParam) : null;
            const surahToSelect = formattedList.find(s => s.number === surahNumber) || formattedList[0];

            setSelectedSurah(surahToSelect);
          }

        } else {
          console.error('Unexpected API response format:', result);
        }
      } catch (error) {
        console.error('Failed to fetch surah list:', error);
      }
    };

    fetchSurahList();
  }, []);


  // Initialize audio context and beep sound
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    beepSoundRef.current = createBeepSound(audioContextRef.current, 800, 0.3);
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  function createBeepSound(audioContext, frequency, duration) {
    return function() {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, duration * 1000);
    };
  }

  // Load ayahs when surah is selected
  useEffect(() => {
    const fetchSurah = async () => {
      if (!selectedSurah) {
        setAyahs([]);
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/v1/surah/get-surah/${selectedSurah.number}`);
        const result = await response.json();

        if (result.success && result.data && result.data.ayahs) {
          const ayahList = [];

          result.data.ayahs.forEach(ayah => {
            if (ayah.bismillah) {
              ayahList.push({
                number: 0,
                text: ayah.bismillah,
              });
            }

            ayahList.push({
              number: parseInt(ayah.number),
              text: ayah.text,
            });
          });

          setAyahs(ayahList);
          scrollToAyah(startAyah || 1);
        } else {
          console.error('Invalid surah data format:', result);
          setAyahs([]);
        }
      } catch (err) {
        console.error(`{baseUrl}/v1/surah/get-surah/${selectedSurah.number}`)
        console.error('Error fetching surah:', err);
        setAyahs([]);
      }
    };

    fetchSurah();
  }, [selectedSurah, startAyah]);

  const scrollToAyah = (ayahNumber) => {
    if (!ayahNumber) return;
    setTimeout(() => {
      const element = ayahRefs.current[ayahNumber];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedAyah(parseInt(ayahNumber));
        setTimeout(() => setHighlightedAyah(null), 2000);
      }
    }, 200);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
 const toggleRecording = () => {
  if (!recording && !recordingPaused) {
    startRecording();
    setReadyToRecite(false);
    setSidebarOpen(false);
  } else if (recording && !recordingPaused) {
    pauseRecording();
    setSidebarOpen(true);
    setTimeout(() => {
      const summary = document.querySelector('.recitation-summary');
      if (summary) {
        summary.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  } else if (recordingPaused) {
    resumeRecording();
    setSidebarOpen(false);
  }
};

useEffect(() => {
  if (!recording && !recordingPaused) {
    setReadyToRecite(true);
  }
}, [selectedSurah]);

  const startRecording = () => {
    setRecording(true);
    setRecordingPaused(false);
    setReadAyahs([]);
    setMistakes([]);
    setProgress(0);
    setRecordingData([]);
    
    // Initialize audio recording (simulated)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = handleDataAvailable;
          mediaRecorderRef.current.start(100); // Collect data every 100ms
          
          // Simulate sending to backend
          const interval = setInterval(() => {
            if (audioChunks.length > 0) {
              // Store recording data locally since we don't have backend
              const timestamp = new Date().toISOString();
              const newData = {
                timestamp,
                chunks: [...audioChunks],
                ayah: currentAyah
              };
              setRecordingData(prev => [...prev, newData]);
              console.log('Storing audio chunks locally:', newData);
              setAudioChunks([]);
            }
          }, 1000);
          
          return () => clearInterval(interval);
        })
        .catch(err => {
          console.error('Error accessing microphone:', err);
          // Fallback to simulated recording
          simulateRecitation();
        });
    } else {
      // Fallback to simulated recording
      simulateRecitation();
    }
    
    simulateRecitation();
  };

  const pauseRecording = () => {
    setRecordingPaused(true);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.pause();
    }
  };

  const resumeRecording = () => {
    setRecordingPaused(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.resume();
    }
    simulateRecitation();
  };


  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      setAudioChunks(prev => [...prev, event.data]);
    }
  };

  const simulateRecitation = () => {
    if (!selectedSurah || !dummyQuranData[selectedSurah.number]) return;
    
    const ayahNumbers = dummyQuranData[selectedSurah.number].map(a => a.number);
    let i = readAyahs.length > 0 ? ayahNumbers.indexOf(readAyahs[readAyahs.length - 1]) + 1 : 0;
    
    const interval = setInterval(() => {
      if (i >= ayahNumbers.length || !recording || recordingPaused) {
        clearInterval(interval);
        if (i >= ayahNumbers.length) {
          setRecording(false);
          setRecordingPaused(false);
        }
        return;
      }

      const currentAyahNum = ayahNumbers[i];
      setCurrentAyah(currentAyahNum);
      setReadAyahs(prev => [...prev, currentAyahNum]);
      
      // Scroll to current ayah
      const element = ayahRefs.current[currentAyahNum];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Simulate occasional mistakes (20% chance)
      if (Math.random() < 0.2 && i > 0) {
        const mistakeWord = `Mistake_${Math.floor(Math.random() * 100)}`;
        setMistakes(prev => [...prev, { 
          ayah: currentAyahNum, 
          correct: 'CorrectWord', 
          user: mistakeWord 
        }]);
        // Play beep sound for mistake
        if (beepSoundRef.current) {
          beepSoundRef.current();
        }
      }

      setProgress(Math.floor((i / ayahNumbers.length) * 100));
      i++;
    }, 1500);
    
    return () => clearInterval(interval);
  };


useEffect(() => {
  if (!recording && !recordingPaused && mistakes.length === 0) {
    setMistakes([
      { user: 'النَّبَايِ' },
      { user: 'مُخْطَلِفُونَ' },
      { user: 'مِهَادُا' },
    ]);
  }
}, [recording, recordingPaused]);


  return (
    <div className="quran-app">
      <Header />
      
      <div className="quran-layout">
        {/* Sidebar */}
        <aside className={`quran-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h3>Quran Recitation</h3>
            <button
              className="close-sidebar-x"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="sidebar-content">
            <div className="form-group">
              <label>Surah Selection</label>
              <div className="dropdown" ref={dropdownRef}>
                <div 
                  className="dropdown-header"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {selectedSurah ? `${selectedSurah.number}. ${selectedSurah.name}` : 'Select Surah'}
                  <FaChevronDown className={`chevron ${dropdownOpen ? 'open' : ''}`} />
                </div>
                {dropdownOpen && (
                  <div className="dropdown-list">
                    {surahList.map(surah => (
                      <div
                          key={surah.number}
                          className="dropdown-item"
                            onClick={() => {
                                setSelectedSurah(surah);
                                setDropdownOpen(false);
                                setStartAyah('');
                                setRecording(false);
                                setRecordingPaused(false);
                                setReadyToRecite(false);
                  }}
                >
                        <span className="surah-number">{surah.number}.</span>
                        <span className="surah-name">{surah.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            

            <div className="form-group">
              <label>Start Ayah (optional)</label>
              <input
                type="number"
                min="1"
                value={startAyah}
                onChange={(e) => setStartAyah(e.target.value)}
                placeholder="Enter ayah number"
                className="ayah-input"
              />
              <button 
                className="go-to-ayah-btn"
                onClick={() => {
    scrollToAyah(startAyah);
    setReadyToRecite(true);     // ✅ Move it here instead!
    setSidebarOpen(false);      // ✅ Close sidebar on recitation start
  }}
                disabled={!selectedSurah}
              >
                Go to Ayah
              </button>
            </div>

            <div className="recitation-summary">
              <h4>Recitation Progress</h4>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{progress}%</span>
              </div>

             {mistakes.length > 0 && (
  <div className="mistakes-container">
    <h5>Areas to Improve</h5>
    <ul>
      {mistakes.map((mistake, i) => (
        <li key={i}>{mistake.user}</li>
      ))}
    </ul>
  </div>
)}

            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`quran-main ${sidebarOpen ? '' : 'centered'}`}>
      <div className="quran-controls">
  {!sidebarOpen && (
  <button 
  className="select-surah-btn" 
  onClick={() => setSidebarOpen(true)}
  disabled={recording || recordingPaused}
>
      Select Surah
    </button>
  )}
  <div className="visibility-toggle-container">
    <HideUnhideToggle
      isHidden={textHidden}
      onToggle={() => setTextHidden(!textHidden)}
    />
  </div>
</div>

          {/* Quran Text Block */}
          <div 
            className={`quran-block ${textHidden ? 'text-hidden' : ''}`}
            ref={quranBlockRef}
          >
            {ayahs.length > 0 ? (
              ayahs.map(ayah => (
                <div 
                  key={ayah.number}
                  ref={el => ayahRefs.current[ayah.number] = el}
                  className={`ayah-container ${highlightedAyah === ayah.number ? 'highlighted' : ''}`}
                >
                  <p 
                    className={`ayah ${readAyahs.includes(ayah.number) ? 'read' : ''} ${
                      mistakes.some(m => m.ayah === ayah.number) ? 'mistake' : ''
                    } ${currentAyah === ayah.number ? 'current' : ''}`}
                    style={{ 
                      filter: textHidden && !readAyahs.includes(ayah.number) ? 'blur(5px)' : 'none',
                      transition: 'filter 0.3s ease'
                    }}
                  >
                    {ayah.text} 
                    <span className="ayah-number">۝ {ayah.number}</span>
                  </p>
                  {textHidden && !readAyahs.includes(ayah.number) && mistakes.some(m => m.ayah === ayah.number) && (
                    <p className="ayah mistake" style={{ color: 'red' }}>
                      {mistakes.find(m => m.ayah === ayah.number).user}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="no-surah-selected">
                <p>Loading Quran text...</p>
              </div>
            )}
          </div>

         <div className="recitation-control">


<button
  className={`recite-btn ${recording ? (recordingPaused ? 'paused' : 'recording') : ''} ${isReciteDisabled ? 'disabled' : ''}`}
  onClick={toggleRecording}
  disabled={isReciteDisabled}
>
  <FaMicrophone className="mic-icon" />
  {!recording && !recordingPaused && 'Start Recitation'}
  {recording && !recordingPaused && 'Pause Recitation'}
  {recordingPaused && 'Resume Recitation'}
  {(recording || recordingPaused) && <span className="pulse-ring"></span>}
</button>

</div>


        </main>
      </div>
    </div>
  );


};



export default Quran;
