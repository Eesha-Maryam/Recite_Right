// Quiz.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './QuizPage.css';

const QuizPage = () => {
  // Get quiz config from previous route (selected Surahs and difficulty)
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSurahs, testMode } = location.state || {};

  // Core quiz states
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for specific question input types
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [userRecitation, setUserRecitation] = useState('');
  const [surahGuess, setSurahGuess] = useState('');
  const [ayahGuess, setAyahGuess] = useState('');

  // Timer state
  const [timer, setTimer] = useState(0); // elapsed time
  const [timeLimit, setTimeLimit] = useState(0); // time limit by difficulty

  // Set time limit based on selected test mode
  useEffect(() => {
    if (testMode === 'easy') setTimeLimit(300);    // 5 mins
    else if (testMode === 'medium') setTimeLimit(600); // 10 mins
    else if (testMode === 'hard') setTimeLimit(900);   // 15 mins
  }, [testMode]);

  // Timer countdown logic
  useEffect(() => {
    if (quizCompleted || loading) return;

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
  }, [quizCompleted, timeLimit, loading]);

  // Fetch quiz questions from backend when component mounts
  useEffect(() => {
    if (!selectedSurahs || selectedSurahs.length === 0) {
      navigate('/');
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedSurahs, testMode }),
        });

        if (!response.ok) throw new Error('Failed to fetch questions');

        const data = await response.json();
        setQuestions(data.questions);
        setAvailableWords(data.questions[0]?.words || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedSurahs, testMode, navigate]);

  // Main logic for evaluating user answers
  const handleAnswerSubmit = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    let isCorrect = false;

    // Check correctness based on question type
    switch (currentQuestion.type) {
      case 'multiple_choice':
        isCorrect = answer === currentQuestion.correctAnswer;
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
        isCorrect = false;
    }

    // Store user's answer and update score
    setUserAnswers([
      ...userAnswers,
      {
        question: currentQuestion,
        userAnswer: answer,
        isCorrect,
      },
    ]);

    if (isCorrect) setScore(score + 1);

    // Move to next question or finish quiz
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextIndex];
      setCurrentQuestionIndex(nextIndex);
      setSelectedWords([]);
      setAvailableWords(nextQuestion?.words || []);
      setUserRecitation('');
      setSurahGuess('');
      setAyahGuess('');
    } else {
      setQuizCompleted(true);
    }
  };

  // Renders for each type of question
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

  // Renders final score and review
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
              <p><strong>Correct answer:</strong> {Array.isArray(answer.question.correctAnswer) ? answer.question.correctAnswer.join(' ') : answer.question.correctAnswer}</p>
            )}
          </div>
        ))}
      </div>
      <button className="restart-btn" onClick={() => navigate('/')}>Start New Quiz</button>
    </div>
  );

  // Main question renderer (delegates to specific type renderer)
  const renderQuestion = () => {
    if (loading) return <div className="loading">Loading questions...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (quizCompleted) return renderResults();

    const question = questions[currentQuestionIndex];
    if (!question) return null;

    switch (question.type) {
      case 'multiple_choice':
        return renderMultipleChoice(question);
      case 'word_arrangement':
        return renderWordArrangement(question);
      case 'recitation':
      case 'recitation_from_point':
        return renderRecitation(question);
      case 'identification':
        return renderIdentification(question);
      default:
        return null;
    }
  };

  // Quit button logic
  const handleQuit = () => {
    if (window.confirm("Are you sure you want to quit the quiz?")) {
      navigate('/');
    }
  };

  // Shows alert box with instructions
  const showInstructions = () => {
    alert("Quiz Instructions:\n- Answer all questions before the timer ends.\n- Each question type is based on Quranic understanding.\n- Click on words or type answers as instructed.");
  };

  // Converts seconds into MM:SS format
  const formatTime = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Final render
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
              <div className="progress-fill" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
          </div>
        )}
        {renderQuestion()}
      </div>
    </div>
  );
};

export default QuizPage;
