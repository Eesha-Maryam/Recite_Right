import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaMicrophone, FaChevronDown, FaStop, FaPause, FaPlay } from 'react-icons/fa';
import Header from '../components/header';
import './Quran.css';
import { useQuranFont } from '../contexts/FontSizeContext';

// Arabic text normalization for comparison
const normalizeArabic = (text) => {
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove harakaat
    .replace(/ٱ/g, 'ا')              // Normalize Alif with Wasla
    .replace(/ة/g, 'ه')              // Normalize Ta marbuta to Ha
    .replace(/ى/g, 'ي')              // Normalize Alif Maqsura
    .replace(/[^\u0621-\u064A\s]/g, '') // Remove non-Arabic letters
    .trim();
};

const Quran = () => {
  // State management
  const { quranFontSize } = useQuranFont();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [startAyah, setStartAyah] = useState('');
  const [ayahs, setAyahs] = useState([]);
  const [textHidden, setTextHidden] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(null);
  const [showRecitationControls, setShowRecitationControls] = useState(false);
  const [recitedWords, setRecitedWords] = useState({});
  const [incorrectWords, setIncorrectWords] = useState({});
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showHideToggle, setShowHideToggle] = useState(true);
  const [mistakesLog, setMistakesLog] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [surahList, setSurahList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Refs
  const ayahRefs = useRef({});
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const beepSoundRef = useRef(null);
  const audioChunksRef = useRef([]);

  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Initialize audio context and beep sound
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    beepSoundRef.current = createBeepSound(audioContextRef.current, 800, 0.3);
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Load surah list on mount
  useEffect(() => {
    const fetchSurahList = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${baseUrl}/surah/list`);
        const data = await response.json();
        setSurahList(data);
        
        // Set initial surah if none selected
        if (!selectedSurah && data.length > 0) {
          setSelectedSurah(data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch surah list:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurahList();
  }, [baseUrl]);

  // Load ayahs when surah is selected
  useEffect(() => {
    const fetchAyahs = async () => {
      if (!selectedSurah) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${baseUrl}/surah/${selectedSurah.number}`);
        const data = await response.json();
        
        const processedAyahs = data.ayahs.map(ayah => ({
          ...ayah,
          words: ayah.text.split(' ').filter(w => w.trim() !== ''),
          number: parseInt(ayah.number)
        }));
        
        setAyahs(processedAyahs);
        
        // Reset start ayah when surah changes
        setStartAyah('1');
      } catch (error) {
        console.error('Failed to fetch ayahs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAyahs();
  }, [selectedSurah, baseUrl]);

  // Handle WebSocket connection
  const startWebSocketConnection = () => {
    if (!selectedSurah || !startAyah) return;

    const sessionId = Date.now();
    setActiveSessionId(sessionId);
    setConnectionStatus('connecting');
    
    wsRef.current = new WebSocket(`${baseUrl.replace('http', 'ws')}/ws/transcribe/${selectedSurah.number}/${startAyah}`);
    
    wsRef.current.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connection established');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.expected_text) {
        // New ayah started
        setCurrentAyah(data.ayah);
        setCurrentWordIndex(0);
        scrollToAyah(data.ayah);
      } 
      else if (data.correct_word) {
        handleCorrectWord(data.correct_word);
      } 
      else if (data.incorrect_word) {
        handleIncorrectWord(data.incorrect_word);
      }
      else if (data.error) {
        console.error('Recitation error:', data.error);
      }
    };
    
    wsRef.current.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket connection closed');
    };
    
    wsRef.current.onerror = (error) => {
      setConnectionStatus('error');
      console.error('WebSocket error:', error);
    };
  };

  // Handle correct word pronunciation
  const handleCorrectWord = (word) => {
    const ayah = currentAyah || parseInt(startAyah);
    const ayahData = ayahs.find(a => a.number === ayah);
    if (!ayahData) return;

    const wordIndex = ayahData.words.findIndex(w => 
      normalizeArabic(w) === normalizeArabic(word)
    );

    if (wordIndex === -1) {
      console.warn('Word not found in ayah:', word, ayahData.words);
      return;
    }

    setRecitedWords(prev => ({
      ...prev,
      [ayah]: [...new Set([...(prev[ayah] || []), wordIndex])]
    }));

    setIncorrectWords(prev => ({
      ...prev,
      [ayah]: (prev[ayah] || []).filter(i => i !== wordIndex)
    }));

    setCurrentWordIndex(wordIndex + 1);
    
    // Mark mistake as corrected if it exists
    setMistakesLog(prev => prev.map(m => 
      m.ayah === ayah && m.word === word ? { ...m, corrected: true } : m
    ));
  };

  // Handle incorrect word pronunciation
  const handleIncorrectWord = (word) => {
    const ayah = currentAyah || parseInt(startAyah);
    const ayahData = ayahs.find(a => a.number === ayah);
    if (!ayahData) return;

    const wordIndex = ayahData.words.findIndex(w => 
      normalizeArabic(w) === normalizeArabic(word)
    );

    if (wordIndex === -1) return;

    // Play beep sound
    if (beepSoundRef.current) beepSoundRef.current();

    // Add to mistakes log if not already there
    setMistakesLog(prev => {
      const existingMistake = prev.find(m => 
        m.ayah === ayah && m.word === word && !m.corrected
      );
      
      if (!existingMistake) {
        return [...prev, {
          sessionId: activeSessionId,
          surahId: selectedSurah.number,
          ayah,
          word,
          timestamp: new Date().toISOString(),
          corrected: false
        }];
      }
      return prev;
    });

    setIncorrectWords(prev => ({
      ...prev,
      [ayah]: [...new Set([...(prev[ayah] || []), wordIndex])]
    }));
  };

  // Start recording and recitation
  const startRecitation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio processing
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(pcmData.buffer);
        } else {
          audioChunksRef.current.push(pcmData.buffer);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Store references for cleanup
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      processorRef.current = processor;
      
      // Start media recorder for backup
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current.start(1000); // Collect data every second
      
      // Initialize WebSocket connection
      startWebSocketConnection();
      
      // Send any buffered audio chunks once connected
      const checkConnection = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          while (audioChunksRef.current.length > 0) {
            const chunk = audioChunksRef.current.shift();
            wsRef.current.send(chunk);
          }
        }
      }, 100);
      
      setRecording(true);
      setShowRecitationControls(true);
      setShowHideToggle(false);
      setSidebarOpen(false);
      
      // Scroll to starting ayah
      scrollToAyah(parseInt(startAyah));
      setCurrentAyah(parseInt(startAyah));
      
    } catch (error) {
      console.error('Error starting recitation:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recitation
  const stopRecitation = () => {
    if (wsRef.current) wsRef.current.close();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    
    setRecording(false);
    setShowRecitationControls(false);
    setShowHideToggle(true);
    setSidebarOpen(true);
    
    // Save session to backend
    saveSession();
  };

  // Pause/resume recitation
  const togglePause = () => {
    if (recordingPaused) {
      // Resume
      if (mediaRecorderRef.current) mediaRecorderRef.current.resume();
      setRecordingPaused(false);
    } else {
      // Pause
      if (mediaRecorderRef.current) mediaRecorderRef.current.pause();
      setRecordingPaused(true);
    }
  };

  // Save session data
  const saveSession = async () => {
    try {
      const response = await fetch(`${baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          surahId: selectedSurah?.number,
          startAyah,
          mistakes: mistakesLog.filter(m => m.sessionId === activeSessionId),
          audioData: audioChunksRef.current.length > 0 ? 
            await blobToBase64(new Blob(audioChunksRef.current)) : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save session');
      }
      
      console.log('Session saved successfully');
      audioChunksRef.current = []; // Clear audio buffer
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  // Helper to convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Scroll to specific ayah
  const scrollToAyah = (ayahNumber) => {
    setTimeout(() => {
      const element = ayahRefs.current[ayahNumber];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Render words with proper visibility and styling
  const renderWords = (ayah) => {
    if (!ayah.words || ayah.words.length === 0) return null;

    return ayah.words.map((word, wordIndex) => {
      const isRecited = (recitedWords[ayah.number] || []).includes(wordIndex);
      const isIncorrect = (incorrectWords[ayah.number] || []).includes(wordIndex);
      const isCurrent = currentAyah === ayah.number && currentWordIndex === wordIndex;
      const shouldShow = isRecited || !textHidden;
      
      return (
        <span
          key={`${ayah.number}-${wordIndex}`}
          className={`word 
            ${isRecited ? 'recited' : ''} 
            ${isIncorrect ? 'incorrect' : ''}
            ${isCurrent ? 'current-word' : ''}`}
          style={{
            visibility: shouldShow ? 'visible' : 'hidden',
            color: isIncorrect ? 'red' : 'black'
          }}
        >
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <div className="quran-app">
      <Header />
      
      <div className="quran-layout">
        {/* Sidebar */}
        <aside className={`quran-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h3>Quran Recitation</h3>
              <div className={`connection-status ${connectionStatus}`}>
                {connectionStatus.toUpperCase()}
              </div>
            </div>
            
            {/* Surah selection */}
            <div className="form-group">
              <label>Select Surah</label>
              <select
                value={selectedSurah?.number || ''}
                onChange={(e) => {
                  const surah = surahList.find(s => s.number === parseInt(e.target.value));
                  setSelectedSurah(surah);
                }}
                disabled={isLoading || recording}
              >
                {isLoading ? (
                  <option>Loading surahs...</option>
                ) : (
                  <>
                    <option value="">Select Surah</option>
                    {surahList.map(surah => (
                      <option key={surah.number} value={surah.number}>
                        {surah.number}. {surah.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            
            {/* Start ayah input */}
            <div className="form-group">
              <label>Start Ayah</label>
              <input
                type="number"
                min="1"
                max={ayahs.length}
                value={startAyah}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (parseInt(value) > 0 && parseInt(value) <= ayahs.length)) {
                    setStartAyah(value);
                  }
                }}
                disabled={isLoading || recording || !selectedSurah}
              />
              <button 
                onClick={startRecitation} 
                disabled={isLoading || recording || !selectedSurah || !startAyah}
                className="start-button"
              >
                <FaMicrophone /> Start Recitation
              </button>
            </div>
            
            {/* Mistakes list */}
            <div className="mistakes-container">
              <h4>Areas to Improve</h4>
              {mistakesLog.length === 0 ? (
                <p className="no-mistakes">No mistakes detected yet</p>
              ) : (
                <ul>
                  {mistakesLog
                    .filter(m => !m.corrected)
                    .map((mistake, index) => (
                      <li 
                        key={index} 
                        className={mistake.corrected ? 'corrected' : ''}
                        onClick={() => {
                          setSelectedSurah(surahList.find(s => s.number === mistake.surahId));
                          setStartAyah(mistake.ayah.toString());
                          scrollToAyah(mistake.ayah);
                        }}
                      >
                        <span className="word">{mistake.word}</span>
                        <span className="location">Surah {mistake.surahId}:{mistake.ayah}</span>
                      </li>
                    ))
                  }
                </ul>
              )}
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className={`quran-main ${sidebarOpen ? '' : 'full-width'}`}>
          {/* Hide/show toggle */}
          {showHideToggle && (
            <div className="hide-toggle">
              <button 
                onClick={() => setTextHidden(!textHidden)}
                className={textHidden ? 'hidden' : ''}
              >
                {textHidden ? 'Show Text' : 'Hide Text'}
              </button>
            </div>
          )}
          
          {/* Quran text */}
          <div className="quran-text" style={{ fontSize: `${quranFontSize}px` }}>
            {isLoading ? (
              <div className="loading">Loading Quran text...</div>
            ) : ayahs.length === 0 ? (
              <div className="no-ayahs">Select a surah to begin</div>
            ) : (
              ayahs.map(ayah => (
                <div
                  key={ayah.number}
                  ref={el => ayahRefs.current[ayah.number] = el}
                  className={`ayah ${currentAyah === ayah.number ? 'current-ayah' : ''}`}
                >
                  {renderWords(ayah)}
                  <span className="ayah-number">{ayah.number}</span>
                </div>
              ))
            )}
          </div>
          
          {/* Recitation controls */}
          {showRecitationControls && (
            <div className="recitation-controls">
              <button onClick={stopRecitation} className="stop-button">
                <FaStop /> Stop
              </button>
              <button 
                onClick={togglePause} 
                className={recordingPaused ? 'resume-button' : 'pause-button'}
              >
                {recordingPaused ? <FaPlay /> : <FaPause />}
                {recordingPaused ? ' Resume' : ' Pause'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Helper function to create beep sound
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
    setTimeout(() => oscillator.stop(), duration * 1000);
  };
}

export default Quran;