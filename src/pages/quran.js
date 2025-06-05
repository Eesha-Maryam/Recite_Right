import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaChevronDown, FaEye, FaEyeSlash, FaBars } from 'react-icons/fa';
import Header from '../components/header';
import './Quran.css';

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

  const surahList = [
    { number: 78, name: 'An-Naba' },
    { number: 114, name: 'An-Nas' }
  ];

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
    if (selectedSurah && dummyQuranData[selectedSurah.number]) {
      setAyahs(dummyQuranData[selectedSurah.number]);
      scrollToAyah(startAyah || 1);
    } else {
      setAyahs([]);
    }
  }, [selectedSurah, startAyah]);

  const scrollToAyah = (ayahNumber) => {
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

  // Simulate recitation with 3-state button (start/pause/resume)
  const toggleRecording = () => {
    if (!recording && !recordingPaused) {
      // First click - start recording
      startRecording();
    } else if (recording && !recordingPaused) {
      // Second click - pause recording
      pauseRecording();
    } else if (recordingPaused) {
      // Third click - resume recording
      resumeRecording();
    }
  };

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

  return (
    <div className="quran-app">
      <Header />
      
      <div className="quran-layout">
        {/* Sidebar */}
        <aside className={`quran-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h3>Quran Recitation</h3>
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
                onClick={() => scrollToAyah(startAyah || 1)}
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
                      <li key={i}>
                        Ayah {mistake.ayah}: <span className="correct">"{mistake.correct}"</span> 
                        (You said: <span className="incorrect">"{mistake.user}"</span>)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`quran-main ${sidebarOpen ? '' : 'centered'}`}>
          {/* Quran Block Controls */}
          <div className="quran-controls">
            <button 
              className="open-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars /> {sidebarOpen ? 'Hide Sidebar' : 'Select Surah'}
            </button>
            
            <div className="visibility-toggle-container">
              <button
                className={`visibility-toggle ${textHidden ? 'hidden' : ''}`}
                onClick={() => setTextHidden(!textHidden)}
              >
                {textHidden ? (
                  <>
                    <FaEye /> Show Text
                  </>
                ) : (
                  <>
                    <FaEyeSlash /> Hide Text
                  </>
                )}
              </button>
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
                <p>Please select a Surah to begin</p>
              </div>
            )}
          </div>

          {/* Recitation Button */}
          <div className="recitation-control">
            <button
              className={`recite-btn ${recording ? 'recording' : ''} ${recordingPaused ? 'paused' : ''}`}
              onClick={toggleRecording}
              disabled={!selectedSurah}
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