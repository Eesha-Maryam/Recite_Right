import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import './dashboard.css';

const Dashboard = () => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [quizList, setQuizList] = useState([]);
  const [reciteSessions, setReciteSessions] = useState([]);


  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const fetchQuizList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          return;
        }

        const response = await fetch('http://localhost:5000/v1/quiz/list', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch quiz list. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Quiz list:', data);
        setQuizList(data.data || []);
      } catch (err) {
        console.error('Error fetching quiz list:', err.message);
      }
    };

    fetchQuizList();
  }, []);

  useEffect(() => {
    const fetchRecitationSessions = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          return;
        }

        const response = await fetch('http://localhost:5000/v1/recitation', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch sessions');

        const data = await response.json();
        console.log('Sessions from backend:', data);
        setReciteSessions(data);
      } catch (error) {
        console.error('Error loading recitation sessions:', error);
      }
    };

    fetchRecitationSessions();
  }, []);


  // Bar chart configuration
  const baseX = 80;
  const baseY = 220;
  const chartHeight = 200;

  // Filter quizzes by selected month
  const filteredQuizzes = quizList
    .filter(
      (quiz) =>
        quiz.attempts &&
        quiz.attempts.length > 0 &&
        new Date(quiz.attempts[0].completedAt).toLocaleString('default', { month: 'long' }) === selectedMonth
    );

  const barCount = filteredQuizzes.length;
  const chartWidth = 680; // total drawable width (760 - 80)
  const maxBarWidth = 40;
  const spacing = chartWidth / Math.max(barCount, 1); // spacing per bar
  const barWidth = Math.min(spacing * 0.6, maxBarWidth); // limit bar width to avoid being too fat

  const reversedQuizzes = [...filteredQuizzes].reverse(); // ⬅️ newest first
  const bars = reversedQuizzes.map((quiz, index) => {
    const attempt = quiz.attempts[0];
    const totalQuestions = quiz.questions.length || 1;
    const score = attempt.score || 0;
    const percentageScore = Math.round((score / totalQuestions) * 100);
    const barHeight = (percentageScore / 100) * chartHeight;
    const y = baseY - barHeight;
    const x = baseX + index * spacing + (spacing - barWidth) / 2;

    const completedDate = new Date(attempt.completedAt);
    const day = completedDate.getDate();
    const year = completedDate.getFullYear().toString().slice(-2); // get last 2 digits
    const formattedDate = `${day}/${year}`; // e.g. 25/25

    return (
      <g key={quiz._id}>
        {/* Bar */}
        <rect x={x} y={y} width={barWidth} height={barHeight} className="bar" />

        {/* Percentage on top */}
        <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="score-label">
          {percentageScore}%
        </text>

        {/* Date below */}
        <text x={x + barWidth / 2} y={240} textAnchor="middle" className="label">
          {formattedDate}
        </text>
      </g>
    );
  });

  // Filter recitations by selected month
  const filteredSessions = reciteSessions.filter(
    (session) =>
      new Date(session.sessionDate).toLocaleString('default', { month: 'long' }) === selectedMonth
  );

  const sessionSpacing = chartWidth / Math.max(filteredSessions.length, 1);
  const sessionBarWidth = Math.min(sessionSpacing * 0.6, maxBarWidth);

  const sessionBars = filteredSessions.map((session, index) => {
    const progress = session.progressRate || 0;
    const barHeight = (progress / 100) * chartHeight;
    const y = baseY - barHeight;
    const x = baseX + index * sessionSpacing + (sessionSpacing - sessionBarWidth) / 2;

    const dateObj = new Date(session.sessionDate);
    const day = dateObj.getDate();
    const year = dateObj.getFullYear().toString().slice(-2);
    const formattedDate = `${day}/${year}`;

    return (
      <g key={session._id}>
        <rect x={x} y={y} width={sessionBarWidth} height={barHeight} className="bar" />
        <text x={x + sessionBarWidth / 2} y={y - 8} textAnchor="middle" className="score-label">
          {progress}%
        </text>
        <text x={x + sessionBarWidth / 2} y={240} textAnchor="middle" className="label">
          {formattedDate}
        </text>
      </g>
    );
  });


  return (
    <div className="dashboard-container">
      <Header />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Here's your analytic details</p>
        </div>

        <div className="dashboard-cards">
          {/* Progress Rate Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Progress Rate</h2>
              <div className="dropdown-container">
                <select
                  className="month-dropdown"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="chart-container">
              <svg
                role="img"
                aria-label="Progress rate bar chart"
                viewBox="0 0 800 250"
                className="chart-svg"
              >
                {/* Y-axis lines */}
                <line x1="60" y1="220" x2="740" y2="220" className="axis" />
                <line x1="60" y1="170" x2="740" y2="170" className="axis" />
                <line x1="60" y1="120" x2="740" y2="120" className="axis" />
                <line x1="60" y1="70" x2="740" y2="70" className="axis" />
                <line x1="60" y1="20" x2="740" y2="20" className="axis" />

                {/* Y-axis labels */}
                <text x="20" y="225" className="label">0%</text>
                <text x="20" y="175" className="label">25%</text>
                <text x="20" y="125" className="label">50%</text>
                <text x="20" y="75" className="label">75%</text>
                <text x="20" y="25" className="label">100%</text>


                {/* Dynamic progress session bars */}
                {sessionBars}

              </svg>
            </div>
          </div>

          {/* Scoreboard Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Scoreboard</h2>
              <div className="dropdown-container">
                <select
                  className="month-dropdown"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="chart-container">
              <svg
                role="img"
                aria-label="Scoreboard bar chart"
                viewBox="0 0 800 250"
                className="chart-svg"
              >
                {/* Y-axis lines */}
                <line x1="80" y1="220" x2="760" y2="220" className="axis" />
                <line x1="80" y1="170" x2="760" y2="170" className="axis" />
                <line x1="80" y1="120" x2="760" y2="120" className="axis" />
                <line x1="80" y1="70" x2="760" y2="70" className="axis" />
                <line x1="80" y1="20" x2="760" y2="20" className="axis" />

                {/* Y-axis labels */}
                <text x="20" y="225" className="label">0%</text>
                <text x="20" y="175" className="label">25%</text>
                <text x="20" y="125" className="label">50%</text>
                <text x="20" y="75" className="label">75%</text>
                <text x="20" y="25" className="label">100%</text>

                {/* Dynamic bars */}
                {bars}
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
