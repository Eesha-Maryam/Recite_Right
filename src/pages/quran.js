import React, { 
  useState, 
  useRef, 
  useEffect,
  useCallback,
  useReducer 
} from 'react';
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
  const { quranFontSize, updateQuranFontSize } = useQuranFont();
  const [summary, setSummary] = useState(null);

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
  const [transcript, setTranscript] = useState('');
  const [recitedWords, setRecitedWords] = useState({}); // Track recited words by ayah
  const [currentWordIndex, setCurrentWordIndex] = useState(0); // Track current word being recited
  const [showHideToggle, setShowHideToggle] = useState(true);
  const recordingIntervalRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const isReciteDisabled = !selectedSurah || !startAyah;
  const baseUrl = process.env.REACT_APP_BASE_URL;

  // Refs
  const ayahRefs = useRef({});
  const dropdownRef = useRef(null);
  const quranBlockRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const beepSoundRef = useRef(null);

  const [words] = useState(["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"]);
  const [visibleIndices, setVisibleIndices] = useState([]);
  const [incorrectWords, setIncorrectWords] = useState({});
  const [currentMode, setCurrentMode] = useState('reciting'); // 'reciting' | 'correcting'
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // REFS
  const audioContextRef = useRef(null);
  const wsRef = useRef(null);
  const beepTimeoutRef = useRef(null);

  // 1. AUDIO SETUP
  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error("Audio init failed:", error);
      }
    };

    // Initialize on user interaction
    const handleFirstInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);

    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      clearTimeout(beepTimeoutRef.current);
    };
  }, []);

  // 2. WEBSOCKET SETUP
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws/1/1');

    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      
      if (data.type === 'mistake') {
        handleMistake(data.position, data.expectedWord);
      } else if (data.type === 'progress') {
        handleProgress(data.newPosition);
      }
    };

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);



  // Dummy Quran Data (expanded for Juz 30)
  const dummyQuranData = {
    78: Array.from({ length: 40 }, (_, i) => ({
      number: i + 1,
      text: 'عَمَّ يَتَسَآءَلُونَ عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ كَلَّا سَيَعْلَمُونَ ثُمَّ كَلَّا سَيَعْلَمُونَ أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَٰدًا وَٱلْجِبَالَ أَوْتَادًا وَخَلَقْنَٰكُمْ أَزْوَٰجًا وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا وَجَعَلْنَا ٱلَّيْلَ لِبَاسًا وَجَعَلْنَا ٱلنَّهَارَ مَعَاشًا وَبَنَيْنَا فَوْقَكُمْ سَبْعًا شِدَادًا وَجَعَلْنَا سِرَاجًا وَهَّاجًا وَأَنزَلْنَا مِنَ ٱلْمُعْصِرَٰتِ مَآءً ثَجَّاجًا لِّنُخْرِجَ بِهِۦ حَبًّا وَنَبَاتًا وَجَنَّٰتٍ أَلْفَافًا'
        .split(' ').slice(0, 30 + Math.floor(Math.random() * 10)).join(' ')
    })),
    114: [
      { number: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ' },
      { number: 2, text: 'مَلِكِ ٱلنَّاسِ' },
      { number: 3, text: 'إِلَـٰهِ ٱلنَّاسِ' },
      { number: 4, text: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ' },
      { number: 5, text: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ' },
      { number: 6, text: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ' }
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



  useEffect(() => {
    const saveSession = () => {
      if (selectedSurah && startAyah) {
        const session = {
          surahId: selectedSurah.number,
          startAyah,
          currentAyah,
          textHidden, // This will save whatever the current state is
          timestamp: Date.now()
        };
        localStorage.setItem('lastRecitation', JSON.stringify(session));
      }
    };

    const interval = setInterval(saveSession, 5000);
    return () => clearInterval(interval);
  }, [selectedSurah, startAyah, currentAyah, textHidden]);





  // Initialize audio context and beep sound
// Modify your audio initialization
useEffect(() => {
  const initAudio = async () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume(); // Required for mobile browsers
      audioContextRef.current = ctx;
      
      // Create beep only after user interaction
      document.addEventListener('click', () => {
        beepSoundRef.current = createBeepSound(ctx, 800, 0.3);
      }, { once: true });
    } catch (err) {
      console.error("Audio init failed:", err);
    }
  };

  initAudio();
  
  return () => {
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
  };
}, []);

  const location = useLocation();
  // Replace your current initialization useEffect with this:
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const surahId = query.get('surahId');
    const startAyahParam = query.get('startAyah');

    if (surahList.length && surahId) {
      const matchedSurah = surahList.find(s => s.number === parseInt(surahId));
      if (matchedSurah) {
        setSelectedSurah(matchedSurah);

        // Always use the ayah from URL parameters for resume
        const ayahToStart = startAyahParam || '1';
        setStartAyah(ayahToStart);
        setCurrentAyah(parseInt(ayahToStart));

        // Scroll after a small delay to ensure DOM is ready
        setTimeout(() => {
          scrollToAyah(parseInt(ayahToStart));
          setHighlightedAyah(parseInt(ayahToStart));
        }, 300);
      }
    }
  }, [location.search, surahList]);



  function createBeepSound(audioContext, frequency, duration) {
    return function () {
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
              words: ayah.text.split(' ') // Split text into words
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
        console.error(`${baseUrl}/v1/surah/get-surah/${selectedSurah.number}`)
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

  // Add this with your other utility functions


  const startRecitation = () => {
    // Add validation for ayah number
    const ayahNum = parseInt(startAyah);
    if (ayahNum <= 0) {
      alert("Ayah number must be at least 1");
      return;
    }

    const selectedSurahAyahs = ayahs.length;
    if (ayahNum > selectedSurahAyahs) {
      alert(`Selected surah only has ${selectedSurahAyahs} ayahs`);
      return;
    }

    if (!selectedSurah) return;

    let ayahToStart = startAyah && parseInt(startAyah) > 0 ? startAyah : '1';
    setStartAyah(ayahToStart);
    setCurrentAyah(parseInt(ayahToStart));

    // Reset recitation tracking
    setRecitedWords({});
    setIncorrectWords({});
    setCurrentWordIndex(0);

    scrollToAyah(ayahToStart);
    setReadyToRecite(false);
    setSidebarOpen(false);
    setShowRecitationControls(true);
    setShowHideToggle(false);

    startRecording();
    startWebSocketConnection();
  };
  
  const startWebSocketConnection = () => {
    if (!selectedSurah || !startAyah) {
      alert("Please select both surah and ayah");
      return;
    }

    const WS_URL = `ws://127.0.0.1:8000/ws/transcribe/${selectedSurah.number}/${startAyah}`;
    wsRef.current = new WebSocket(WS_URL);
    wsRef.current.binaryType = 'arraybuffer';

    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('Received data from model API:', data);

      if (data.incorrect_words) {
        // Handle array of incorrect words
        data.incorrect_words.forEach(([expectedWord, recitedWord]) => {
          handleIncorrectWord(expectedWord);
        });
      } else if (data.incorrect_word) {
        // Handle single incorrect word (backward compatibility)
        handleIncorrectWord(data.incorrect_word);
      }

      if (data.type === "summary") {
        console.log("Final summary received:", data);
        setFinalSummary(data);
        // Update mistakes list from summary
        if (data.mistakes) {
          setMistakes(data.mistakes);
        }
      }


      if (data.error) {
        console.error("Error from server:", data.error);
      }
    };

    wsRef.current.onopen = () => {
      console.log("WebSocket connection established");
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      wsRef.current = null; // Moved here instead of closing manually in stopRecitation
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };


  const handleCorrectWord = (word) => {
    // Find the current ayah and word index
    const ayah = currentAyah || parseInt(startAyah);
    const ayahData = ayahs.find(a => a.number === ayah);
    if (!ayahData) return;

    const wordIndex = ayahData.words.indexOf(word);
    if (wordIndex === -1) return;

    // Mark the word as recited
    setRecitedWords(prev => {
      const ayahRecitedWords = prev[ayah] || [];
      return {
        ...prev,
        [ayah]: [...ayahRecitedWords, wordIndex]
      };
    });

    // Remove from incorrect words if it was there
    setIncorrectWords(prev => {
      const ayahIncorrectWords = prev[ayah] || [];
      return {
        ...prev,
        [ayah]: ayahIncorrectWords.filter(i => i !== wordIndex)
      };
    });

    setCurrentWordIndex(wordIndex + 1);
  };

  const handleIncorrectWord = (word) => {
    const ayah = currentAyah || parseInt(startAyah);
    const ayahData = ayahs.find(a => a.number === ayah);
    if (!ayahData) return;

    const wordIndex = ayahData.words.indexOf(word);
    if (wordIndex === -1) return;

    // Play beep sound
    if (beepSoundRef.current) beepSoundRef.current();

    // Speak the correct word
    speakWord(ayahData.words[wordIndex]);

    // Mark the word as incorrect
    setIncorrectWords(prev => {
      const ayahIncorrectWords = prev[ayah] || [];
      return {
        ...prev,
        [ayah]: [...ayahIncorrectWords, wordIndex]
      };
    });
  };

  const stopRecitation = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Tell backend that recitation is finished
      wsRef.current.send(JSON.stringify({ type: "end" }));
    }

    setRecording(false);
    setRecordingPaused(false);
    setShowRecitationControls(false);
    setSidebarOpen(true);
    setShowHideToggle(true);


    // Cleanup WebSocket
    if (wsRef.current) {
      // Let server close WebSocket after sending summary
      wsRef.current = null;
    }

    // Cleanup MediaRecorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    // Cleanup Audio Context
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    // Cleanup processor and source
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    clearInterval(recordingIntervalRef.current);

    setTimeout(() => {
      const summary = document.querySelector('.recitation-summary');
      if (summary) {
        summary.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
          // Initialize audio context and processor for WebSocket
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

          processorRef.current.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);

            for (let i = 0; i < inputData.length; i++) {
              let s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(pcmData.buffer);
            }
          };

          sourceRef.current.connect(processorRef.current);
          processorRef.current.connect(audioContextRef.current.destination);

          // Also initialize MediaRecorder for local recording
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
              sendAudioToBackend(newData);
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

  const pauseRecording = () => {
    setRecordingPaused(true);
    // Explicit save on pause
    const session = {
      surahId: selectedSurah.number,
      startAyah,
      currentAyah,
      textHidden, // Save current visibility state
      timestamp: Date.now()
    };
    localStorage.setItem('lastRecitation', JSON.stringify(session));
  };


  const resumeRecording = () => {
    setRecordingPaused(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.resume();
    }
    // Reconnect audio processor for WebSocket
    if (sourceRef.current && processorRef.current) {
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    }

    // Scroll to current ayah when resuming
    scrollToAyah(currentAyah);
    setHighlightedAyah(currentAyah);

    simulateRecitation();
  };
  const handleDataAvailable = (event) => {3

    if (event.data.size > 0) {
      setAudioChunks(prev => [...prev, event.data]);
    }
  };


  const cleanupRef = useRef(false);

  // Audio initialization
  useEffect(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error("AudioContext failed:", error);
      }
    }

    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close?.();
      }
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/1/1');
      
      wsRef.current.onmessage = (e) => {
        if (cleanupRef.current) return;
        const data = JSON.parse(e.data);
        
        if (data.type === 'progress') {
          setVisibleIndices(prev => [...prev, data.visible_word]);
          setCorrectionMode(null);
        }
        else if (data.type === 'mistake') {
          playBeep();
          setCorrectionMode({
            position: data.position,
            expected: data.expected,
            attempts: 0
          });
          setIncorrectIndices(prev => ({
            ...prev,
            [data.position]: 'incorrect'
          }));
        }
      };
    }

    return () => {
      cleanupRef.current = true;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const playBeep = () => {
    if (!audioContextRef.current) return;
    
    try {
      const osc = audioContextRef.current.createOscillator();
      osc.connect(audioContextRef.current.destination);
      osc.type = 'sine';
      osc.frequency.value = 800;
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.2);
    } catch (error) {
      console.error("Beep failed:", error);
    }
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

      // Simulate word-by-word recitation
      const ayahData = ayahs.find(a => a.number === currentAyahNum);
      if (ayahData && ayahData.words) {
        let wordIndex = 0;
        const wordInterval = setInterval(() => {
          if (wordIndex >= ayahData.words.length || !recording || recordingPaused) {
            clearInterval(wordInterval);
            return;
          }

          // 20% chance of making a mistake
          if (Math.random() < 0.2) {
            handleIncorrectWord(ayahData.words[wordIndex]);
          } else {
            handleCorrectWord(ayahData.words[wordIndex]);
          }

          wordIndex++;
        }, 1000);
      }

      setProgress(Math.floor((i / ayahNumbers.length) * 100));
      i++;
    }, 3000);

    return () => clearInterval(interval);
  };

  // Helper function to check if ayah is Bismillah (ayah 0)
  const isBismillah = (ayah) => {
    return ayah.number === 0 || (ayah.number === 1 && ayah.text.includes('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'));
  };

  // Helper function to get Bismillah text
  const getBismillahText = (ayah) => {
    if (ayah.number === 0) {
      return ayah.text;
    }
    // If it's ayah 1 and contains Bismillah, extract just the Bismillah part
    if (ayah.text.includes('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')) {
      return 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
    }
    return ayah.text;
  };

  // Helper function to get remaining text after Bismillah
  const getRemainingText = (ayah) => {
    if (ayah.number === 0) return '';
    if (ayah.text.includes('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')) {
      return ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '').trim();
    }
    return ayah.text;
  };

    const handleRecitation = (text) => {
    if (correctionMode) {
      const corrected = text.includes(correctionMode.expected);
      
      if (corrected) {
        setIncorrectIndices(prev => ({
          ...prev,
          [correctionMode.position]: 'corrected'
        }));
        setCorrectionMode(null);
      }
      else if (correctionMode.attempts >= 1) {
        setIncorrectIndices(prev => ({
          ...prev,
          [correctionMode.position]: 'permanent_error'
        }));
        setCorrectionMode(null);
      }
      else {
        setCorrectionMode(prev => ({...prev, attempts: prev.attempts + 1}));
      }
    }
    
    wsRef.current.send(text);
  };

  
  // Add to Quran component
const useFeedbackQueue = () => {
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    const { type, data } = queueRef.current.shift();
    
    switch (type) {
      case 'BEEP':
        await playBeep(); // Your existing beep function
        break;
      case 'HIGHLIGHT':
        setIncorrectWords(prev => ({ ...prev, [data.ayah]: data.wordIndex }));
        break;
      case 'PRONOUNCE':
        await speakWord(data.word); // Your TTS function
        break;
    }

    isProcessingRef.current = false;
    processQueue();
  }, []);

  const addToQueue = (type, data) => {
    queueRef.current.push({ type, data });
    processQueue();
  };

  return { addToQueue };
};// Add this custom hook INSIDE your Quran component (before the render)



// Then use it in your component
const { addToQueue } = useFeedbackQueue();

// Replace useState with this reducer
const recitationReducer = (state, action) => {
  switch (action.type) {
    case 'WORD_RECITED':
      return {
        ...state,
        [action.ayah]: {
          ...state[action.ayah],
          [action.wordIndex]: 'CORRECT'
        }
      };
    case 'WORD_MISTAKE':
      addToQueue('BEEP'); // From our queue system
      addToQueue('HIGHLIGHT', { ayah: action.ayah, wordIndex: action.wordIndex });
      addToQueue('PRONOUNCE', { word: action.correctWord });
      
      return {
        ...state,
        [action.ayah]: {
          ...state[action.ayah],
          [action.wordIndex]: 'INCORRECT'
        }
      };
    default:
      return state;
  }
};



// Usage
const [recitationState, dispatch] = useReducer(recitationReducer, {});
  // Render words with recitation tracking
  const renderWords = (ayah, isBismillahAyah = false) => {
    if (!ayah.words) return ayah.text;

    return ayah.words.map((word, wordIndex) => {
      const isRecited = recitedWords[ayah.number]?.includes(wordIndex);
      const isIncorrect = incorrectWords[ayah.number]?.includes(wordIndex);
      const isCurrent = currentWordIndex === wordIndex && currentAyah === ayah.number;

      // Always show Bismillah words
      const shouldShowWord = isRecited || !textHidden || isBismillahAyah;

      return (
        <span
          key={`${ayah.number}-${wordIndex}`}
          className={`word ${isRecited ? 'recited' : ''} ${isIncorrect ? 'incorrect' : ''} ${isCurrent ? 'current-word' : ''}`}
          style={{
            visibility: shouldShowWord ? 'visible' : 'hidden',
            color: isIncorrect ? 'red' : 'inherit'
          }}
        >
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <div className="quran-app no-scroll">
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
                max={ayahs.length} // Set max to number of ayahs in selected surah
                value={startAyah}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only update if value is empty or a valid number >= 1
                  if (value === '' || (parseInt(value) > 0 && parseInt(value) <= ayahs.length)) {
                    setStartAyah(value);
                  }
                }}
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

            {finalSummary && (
              <div className="recitation-summary">
                <h4>Recitation Summary</h4>
                <div className="progress-percentage">{finalSummary.progress_rate}</div>

                {finalSummary?.incorrect_words?.length > 0 && (
                  <div className="mistakes-container">
                    <h5>Areas to Improve</h5>
                    <div className="mistakes-list-wrapper">
                      <ul className="mistakes-list">
                        {finalSummary.incorrect_words.map(([expectedWord], index) => (
                          <li key={`mistake-${index}`} className="mistake-item">
                            <span className="incorrect-word">
                              {expectedWord}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={`quran-main ${sidebarOpen ? '' : 'centered'}`}>
          <div className="quran-controls">
            {showHideToggle && (
              <div className="visibility-toggle-container">
                <HideUnhideToggle
                  isHidden={textHidden}
                  onToggle={() => setTextHidden(!textHidden)}
                />
              </div>
            )}
          </div>








          {/* Quran Text Block */}
          <div className="quran-block" ref={quranBlockRef}>
            {ayahs.length > 0 ? (
              <>
                {/* Bismillah line (if exists in first ayah) */}
                {isBismillah(ayahs[0]) && (
                  <div className="bismillah-line-container">
                    <div
                      ref={el => ayahRefs.current[ayahs[0].number] = el}
                      className={`bismillah-line  ${readAyahs.includes(ayahs[0].number) ? 'read' : ''} ${highlightedAyah === ayahs[0].number ? 'highlighted' : ''}`}
                      style={{ fontSize: `${quranFontSize}px` }}
                    >
                      {renderWords(ayahs[0], true)}
                    </div>
                  </div>
                )}


                {/* Remaining Ayahs */}
                <p
                  className="quran-text"
                  style={{
                    fontSize: `${quranFontSize}px`,
                    lineHeight: `${quranFontSize * 1.5}px`,
                    textAlign: 'justify'
                  }}
                >
                  {ayahs.map((ayah, index) => {
                    // Skip already rendered bismillah
                    if (index === 0 && isBismillah(ayah)) {
                      const remainingText = getRemainingText(ayah);
                      if (!remainingText) return null;

                      return (
                        <span
                          key={ayah.number}
                          ref={el => ayahRefs.current[ayah.number] = el}
                          className={`ayah 
  ${readAyahs.includes(ayah.number) ? 'read' : ''} 
  ${mistakes.some(m => m.ayah === ayah.number) ? 'mistake' : ''} 
  ${currentAyah === ayah.number ? 'current' : ''} 
  ${highlightedAyah === ayah.number ? 'highlighted' : ''}`}

                        >

                          {renderWords(ayah)}
                          <span className="ayah-number-circle">
                            <span className="ayah-number">{ayah.number}</span>
                          </span>
                        </span>
                      );
                    }

                    return (
                      <span
                        key={ayah.number}
                        ref={el => ayahRefs.current[ayah.number] = el}
                        className={`ayah 
    ${readAyahs.includes(ayah.number) ? 'read' : ''} 
    ${mistakes.some(m => m.ayah === ayah.number) ? 'mistake' : ''} 
    ${currentAyah === ayah.number ? 'current' : ''} 
    ${highlightedAyah === ayah.number ? 'highlighted' : ''}`}
                      >

                        {renderWords(ayah)}
                        <span className="ayah-number-circle">
                          <span className="ayah-number">{ayah.number}</span>
                        </span>
                      </span>
                    );
                  })}
                </p>
              </>
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