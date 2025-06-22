import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaMicrophone, FaChevronDown, FaEye, FaEyeSlash, FaBars, FaTimes, FaStop, FaPause, FaPlay } from 'react-icons/fa';
import Header from '../components/header';
import './Quran.css';
import { useQuranFont } from '../contexts/FontSizeContext'; 
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

{/*
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

*/}

function useQuery() {
  const location = useLocation();
  return new URLSearchParams(location.search);
}

const Quran = () => {
  // State management
    const { quranFontSize, updateQuranFontSize } = useQuranFont();
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
  const [showRecitationControls, setShowRecitationControls] = useState(false);
  const recordingIntervalRef = useRef(null);
  const isReciteDisabled = !selectedSurah || !startAyah;
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
            setStartAyah('1');

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
            ayahList.push({
              number: parseInt(ayah.number),
              text: ayah.text,
            });
          });

          setAyahs(ayahList);
          if (startAyah) {
            scrollToAyah(startAyah);
          }
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
  }, [selectedSurah]);

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

 const startRecitation = () => {
  if (!selectedSurah) return;

  let ayahToStart = startAyah && parseInt(startAyah) > 0 ? startAyah : '1';
  setStartAyah(ayahToStart);
    
    scrollToAyah(startAyah);
    setReadyToRecite(false);
    setSidebarOpen(false);
    setShowRecitationControls(true);
    startRecording();
  };



const stopRecitation = () => {
  setRecording(false);
  setRecordingPaused(false);
  setShowRecitationControls(false);
  setSidebarOpen(true);

  clearInterval(recordingIntervalRef.current);

  setTimeout(() => {
    const summary = document.querySelector('.recitation-summary');
    if (summary) {
      summary.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
};


const handleDataAvailable = (event) => {
  if (event.data.size > 0) {
    setAudioChunks(prev => [...prev, event.data]);
  }
};

 const startRecording = () => {
  setRecording(true);
  setRecordingPaused(false);
  setReadAyahs([]);
  setMistakes([]);
  setProgress(0);
  setRecordingData([]);
  setAudioChunks([]);

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = handleDataAvailable;
        mediaRecorderRef.current.start(1);

       recordingIntervalRef.current = setInterval(() => {
  if (audioChunks.length > 0) {
    const timestamp = new Date().toISOString();
    const newData = {
      timestamp,
      chunks: [...audioChunks],
      ayah: currentAyah
    };

    setRecordingData(prev => [...prev, newData]);
    sendAudioToBackend(newData); // 👈 Upload audio
    setAudioChunks([]);
  }
}, 1000);

      })
      .catch(err => {
        console.error('Microphone error:', err);
        simulateRecitation();
      });
  } else {
    simulateRecitation();
  }

  simulateRecitation();
};

const speakWord = (word) => {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'ar-SA'; // Arabic voice
    window.speechSynthesis.speak(utter);
  }
};

const sendAudioToBackend = async (data) => {
  const formData = new FormData();
  const blob = new Blob(data.chunks, { type: 'audio/webm' });
  formData.append('file', blob);
  formData.append('ayah', data.ayah);
  formData.append('timestamp', data.timestamp);

  try {
    await fetch(`${baseUrl}/v1/recitation/audio-upload`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Error sending audio to backend:', error);
  }
};


const saveRecitationState = async (surahId, startAyah, currentAyah) => {
  const state = {
    surahId,
    startAyah,
    currentAyah,
    timestamp: new Date().toISOString(),
  };

  try {
    // Try sending to backend
    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/recitation/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    });

    if (!response.ok) throw new Error('Backend failed');
  } catch (err) {
    console.warn('Saving to backend failed. Saving to localStorage instead.');
    localStorage.setItem('lastRecitation', JSON.stringify(state));
  }
};


const pauseRecording = () => {
  setRecordingPaused(true);
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.pause();
  }

  // Save current recitation state when paused
  if (selectedSurah?.number && startAyah && currentAyah) {
    saveRecitationState(selectedSurah.number, startAyah, currentAyah);
  }
};


const resumeRecording = () => {
  // Try to use existing state
  if (selectedSurah && startAyah) {
    setRecordingPaused(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.resume();
    }
    simulateRecitation();
    return;
  }

  // If state is lost, try to recover from localStorage
  const lastSession = localStorage.getItem('lastRecitation');
  if (!lastSession) {
    alert("No recitation session found. Please start a new one.");
    return;
  }

  const { surahId, startAyah: savedStartAyah, currentAyah } = JSON.parse(lastSession);

  const matchingSurah = surahList.find(s => s.number === surahId);
  if (!matchingSurah) {
    alert("Saved surah not found in list. Please select manually.");
    return;
  }

  // Restore session state
  setSelectedSurah(matchingSurah);
  setStartAyah(savedStartAyah);
  setCurrentAyah(currentAyah);
  setRecordingPaused(false);

  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.resume();
  }

  simulateRecitation();
};




  const simulateRecitation = () => {
    if (!selectedSurah || !dummyQuranData[selectedSurah.number]) return;
    
    const ayahNumbers = dummyQuranData[selectedSurah.number].map(a => a.number);
    let i = startAyah ? ayahNumbers.indexOf(parseInt(startAyah)) : 0;
    
    const interval = setInterval(() => {
      if (i >= ayahNumbers.length || !recording || recordingPaused) {
        clearInterval(interval);
        if (i >= ayahNumbers.length) {
          stopRecitation();
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
  
  // 🔊 Beep + Speak
  if (beepSoundRef.current) beepSoundRef.current();
  speakWord('الكلمة الخاطئة'); // Replace with actual Arabic word if needed
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
          
          </div>

          <div className="sidebar-content">
            <div className="form-group">
              <label>Select Surah</label>
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
              <label>Start Ayah</label>
              <input
                type="number"
                min="1"
                value={startAyah}
                onChange={(e) => setStartAyah(e.target.value)}
                placeholder="Enter ayah number"
                className="ayah-input"
              />
              <button 
                className={`start-recitation-btn ${isReciteDisabled ? 'disabled' : ''}`}
                onClick={startRecitation}
                disabled={isReciteDisabled}
              >
                Start Recitation
              </button>
            </div>

            <div className="recitation-summary">
              <h4>Recitation Progress</h4>
              <div className="progress-percentage">{progress}%</div>

              {mistakes.length > 0 && (
                <div className="mistakes-container">
                  <h5>Areas to Improve</h5>
                  <ul>
                    {mistakes.map((mistake, i) => (
                      <li key={i} className="mistake-item">
                        <span className="incorrect-word">{mistake.user}</span>
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
          <div className="quran-controls">
           
         {/*  <div className="visibility-toggle-container">
              <HideUnhideToggle
                isHidden={textHidden}
                onToggle={() => setTextHidden(!textHidden)}
              />
            </div> */}
          </div>

          {/* Quran Text Block */}
        <div className={`quran-block ${textHidden ? 'text-hidden' : ''}`} ref={quranBlockRef}>
  {ayahs.length > 0 ? (
    <p 
      className="quran-text"
      style={{ 
        fontSize: `${quranFontSize}px`,
        lineHeight: `${quranFontSize * 1.5}px`
      }}
    >
      {ayahs.map(ayah => (
        <span
          key={ayah.number}
          ref={el => ayahRefs.current[ayah.number] = el}
          className={`ayah ${readAyahs.includes(ayah.number) ? 'read' : ''} ${mistakes.some(m => m.ayah === ayah.number) ? 'mistake' : ''} ${currentAyah === ayah.number ? 'current' : ''} ${highlightedAyah === ayah.number ? 'highlighted' : ''}`}
          style={{
            filter: textHidden && !readAyahs.includes(ayah.number) ? 'blur(5px)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        >
          {ayah.text}
          <span className="ayah-number"> ۝ {ayah.number} </span>
        </span>
      ))}
    </p>
  ) : (
    <div className="no-surah-selected">
      <p>Loading Quran text...</p>
    </div>
  )}
</div>
          {showRecitationControls && (
            <div className="recitation-controls-container">
              <div className="recitation-controls">
                <button
                  className="recitation-control-btn stop-btn"
                  onClick={stopRecitation}
                >
                  <FaStop /> Stop
                </button>
                {recordingPaused ? (
                  <button
                    className="recitation-control-btn resume-btn"
                    onClick={resumeRecording}
                    
                  >
                    <FaPlay /> Resume
                  </button>
                ) : (
                  <button
                    className="recitation-control-btn pause-btn"
                    onClick={pauseRecording}
                  >
                    <FaPause /> Pause
                  </button>
                  
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

};


export default Quran;

