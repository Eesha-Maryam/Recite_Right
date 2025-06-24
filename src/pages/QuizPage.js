import React, { useState, useEffect, useRef } from 'react'; // ✅ useRef added
import { useLocation, useNavigate } from 'react-router-dom';
import './QuizPage.css';

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quizConfig, setQuizConfig] = useState(() => {
  return location.state || JSON.parse(localStorage.getItem('quizData')) || null;
});

  const { selectedSurahs, testMode } = location.state || {};

  const firstRender = useRef(true); // ✅ Reference to track first render
  const baseUrl = process.env.REACT_APP_BASE_URL;

  // Core quiz states
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // States for question input types
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [userRecitation, setUserRecitation] = useState('');
  const [surahGuess, setSurahGuess] = useState('');
  const [ayahGuess, setAyahGuess] = useState('');

  // Timer state
  const [timer, setTimer] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (testMode === 'easy') setTimeLimit(300);
    else if (testMode === 'medium') setTimeLimit(600);
    else if (testMode === 'hard') setTimeLimit(900);
  }, [testMode]);

  useEffect(() => {
    if (quizCompleted) submitQuizResult();
  }, [quizCompleted]);

  useEffect(() => {
    if (!timerActive || quizCompleted) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev + 1 >= timeLimit) {
          clearInterval(interval);
          setQuizCompleted(true);
          return timeLimit;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, quizCompleted, timeLimit]);

  useEffect(() => {
 if (!quizConfig || !selectedSurahs || selectedSurahs.length === 0) {
  navigate('/');
  return;
}


    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const surahNames = selectedSurahs.map(s => s.name).join(',');
        const numQuestions = 10;


        const response = await fetch(`${baseUrl}/v1/quiz?topic=${encodeURIComponent(surahNames)}&numQuestions=${numQuestions}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch questions');

        const { data } = await response.json();
        if (!data?.questions) throw new Error('Invalid question data');

        setQuestions(data.questions);
        if (data.id) setQuizId(data.id);

        setDataLoaded(true);
        setTimerActive(true);
        setLoading(false);

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedSurahs, testMode, navigate]);





  const submitQuizResult = async () => {
    try {
      if (quizSubmitted) return;

      const token = localStorage.getItem('accessToken');
      if (!quizId) throw new Error('No quiz ID available');

      const answersPayload = userAnswers
        .filter(ans => ans.question._id)
        .map(ans => ({
          questionId: ans.question._id,
          selectedOption: ans.question.options.findIndex(opt => opt === ans.userAnswer)
        }));

      const response = await fetch(`${baseUrl}/v1/quiz/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quizId, answers: answersPayload })
      });

      if (!response.ok) throw new Error(`Failed to submit quiz. Status: ${response.status}`);

      await response.json();
      setQuizSubmitted(true);

    } catch (err) {
      console.error('Error submitting quiz:', err.message);
    }
  };

  const handleAnswerSubmit = (answer) => {
    if (answer === undefined || answer === null || (Array.isArray(answer) && answer.length === 0)) {
      console.warn('Blocked accidental or empty auto-submit.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    let isCorrect = false;

    switch (currentQuestion.type) {
      case 'multiple_choice':
        isCorrect = answer === currentQuestion.options[currentQuestion.correctAnswer];
        break;
      case 'word_arrangement':
        isCorrect = JSON.stringify(answer) === JSON.stringify(currentQuestion.correctOrder);
        break;
      case 'recitation':
      case 'recitation_from_point':
        isCorrect = answer.trim().toLowerCase() === currentQuestion.correctAnswers[0].trim().toLowerCase();
        break;
      case 'identification':
        isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
        break;
      default:
        isCorrect = answer === currentQuestion.options[currentQuestion.correctAnswer];
    }

    setUserAnswers(prev => [...prev, { question: currentQuestion, userAnswer: answer, isCorrect }]);
    if (isCorrect) setScore(prev => prev + 1);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const renderMultipleChoice = (question) => (
    <div className="question-container">
      <h3 className="question-text">{question.question}</h3>
      <p className="reference-text">{question.reference}</p>
      <div className="options-container">
        {question.options.map((option, index) => (
          <button key={index} className="option-btn" onClick={() => handleAnswerSubmit(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const renderWordArrangement = (question) => {
    const selectWord = (word, index) => {
      const newAvailable = [...availableWords];
      newAvailable.splice(index, 1);
      setAvailableWords(newAvailable);
      setSelectedWords([...selectedWords, word]);
    };

    const unselectWord = (word, index) => {
      const newSelected = [...selectedWords];
      newSelected.splice(index, 1);
      setSelectedWords(newSelected);
      setAvailableWords([...availableWords, word]);
    };

    return (
      <div className="question-container">
        <h3 className="question-text">{question.question}</h3>
        <div className="selected-words">
          {selectedWords.map((word, index) => (
            <span key={`selected-${index}`} className="word-tag" onClick={() => unselectWord(word, index)}>
              {word}
            </span>
          ))}
        </div>
        <div className="available-words">
          {availableWords.map((word, index) => (
            <span key={`available-${index}`} className="word-tag" onClick={() => selectWord(word, index)}>
              {word}
            </span>
          ))}
        </div>
        <button className="submit-btn" onClick={() => handleAnswerSubmit(selectedWords)} disabled={selectedWords.length === 0}>
          Submit
        </button>
      </div>
    );
  };

  const renderRecitation = (question) => (
    <div className="question-container">
      <h3 className="question-text">{question.question}</h3>
      <p className="reference-text">{question.reference}</p>
      <textarea
        className="recitation-input"
        value={userRecitation}
        onChange={(e) => setUserRecitation(e.target.value)}
        placeholder="Type the ayahs here..."
        rows={5}
      />
      <button className="submit-btn" onClick={() => handleAnswerSubmit(userRecitation)} disabled={!userRecitation.trim()}>
        Submit
      </button>
    </div>
  );

  const renderIdentification = (question) => (
    <div className="question-container">
      <h3 className="question-text">{question.question}</h3>
      <p className="ayah-text">{question.ayahText}</p>
      <div className="identification-inputs">
        <input type="text" value={surahGuess} onChange={(e) => setSurahGuess(e.target.value)} placeholder="Surah name" />
        <input type="number" value={ayahGuess} onChange={(e) => setAyahGuess(e.target.value)} placeholder="Ayah number" min="1" />
      </div>
      <button
        className="submit-btn"
        onClick={() => handleAnswerSubmit(`${surahGuess} ${ayahGuess}`)}
        disabled={!surahGuess.trim() || !ayahGuess}
      >
        Submit
      </button>
    </div>
  );

  const renderResults = () => (
    <div className="results-container">
      <h2>Quiz Completed!</h2>
      <p className="score-text">
        Your score: {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
      </p>
      <div className="answers-review">
        {userAnswers.map((answer, index) => (
          <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
            <h4>Question {index + 1}</h4>
            <p><strong>Question:</strong> {answer.question.question}</p>
            {answer.question.reference && <p><strong>Reference:</strong> {answer.question.reference}</p>}
            <p><strong>Your answer:</strong> {Array.isArray(answer.userAnswer) ? answer.userAnswer.join(' ') : answer.userAnswer}</p>
            {!answer.isCorrect && (
              <p><strong>Correct answer:</strong> {
                Array.isArray(answer.question.correctAnswer)
                  ? answer.question.correctAnswer.join(' ')
                  : answer.question.options[answer.question.correctAnswer]
              }</p>
            )}
          </div>
        ))}
      </div>
      <button className="restart-btn" onClick={() => navigate('/memorization-test')}>Start New Quiz</button>
    </div>
  );

  const renderQuestion = () => {
    if (loading) return <div className="loading">Loading questions...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (quizCompleted) return renderResults();
    if (!dataLoaded) return <div className="loading">Preparing quiz...</div>;

    const question = questions[currentQuestionIndex];
    if (!question) return <div className="error">Question not available</div>;

    switch (question.type) {
      case 'multiple_choice': return renderMultipleChoice(question);
      case 'word_arrangement': return renderWordArrangement(question);
      case 'recitation':
      case 'recitation_from_point': return renderRecitation(question);
      case 'identification': return renderIdentification(question);
      default: return renderMultipleChoice(question);
    }
  };

  const handleQuit = () => {
    if (window.confirm("Are you sure you want to quit the quiz?")) {
      navigate('/memorization-test');
    }
  };

  const showInstructions = () => {
    alert("Quiz Instructions:\n- Answer all questions before the timer ends.\n- Each question type is based on Quranic understanding.\n- Click on words or type answers as instructed.");
  };

  const formatTime = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <div></div>
        <div className="quiz-timer">{formatTime(timer)}</div>
        <div className="quiz-controls">
          <button onClick={handleQuit}><i className="fas fa-times"></i></button>
          <button onClick={showInstructions}><i className="fas fa-question-circle"></i></button>
        </div>
      </header>

      <div className="quiz-container">
        {!quizCompleted && questions.length > 0 && (
          <div className="progress-indicator">
            Question {currentQuestionIndex + 1} of {questions.length}
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}></div>
            </div>
          </div>
        )}
        {renderQuestion()}
      </div>
    </div>
  );
};

export default QuizPage;
