import React from 'react';
import Header from '../components/header';
import './help.css';

/**
 * Array of help section objects containing:
 * - id: The HTML anchor ID for the section
 * - title: The display title of the section
 */
const sections = [
  { id: 'login', title: 'Login / Signup' },
  { id: 'profile', title: 'User Profile' },
  { id: 'recitation', title: 'Recitation Session' },
  { id: 'memorization', title: 'Quran Memorization Test' },
  { id: 'mutashabihat', title: 'Mutashabihat' },
  { id: 'feedback', title: 'Feedback' },
  { id: 'support', title: 'Support / Help' }
];

/**
 * Help Component - Displays the user manual/help documentation for the application
 * Contains a sidebar navigation and detailed content sections
 */
const Help = () => {
  return (
    <>
      {/* Fixed header with white background */}
      <Header fixed backgroundColor="#ffffff" />
      
      {/* Main container for help content */}
      <div className="help-container">
        {/* Sidebar navigation */}
        <aside className="help-sidebar">
          <h2 className="sidebar-title">User Manual</h2>
          <ul className="sidebar-list">
            {/* Map through sections to create navigation links */}
            {sections.map((section, index) => (
              <React.Fragment key={section.id}>
                <li className="sidebar-item">
                  <a href={`#${section.id}`} className="sidebar-link">
                    {/* Format section number (1.1, 1.2, etc.) */}
                    {`1.${index + 1}`} {section.title}
                  </a>
                </li>
                <li className="sidebar-separator"></li>
              </React.Fragment>
            ))}
          </ul>
        </aside>

        {/* Main content area with all help sections */}
        <main className="help-content">
          {/* Login/Signup Section */}
          <section id="login">
            <h2>1.1 Login / Signup</h2>
            <ul>
              <li>To create an account,</li>
              <li>Navigate to Sign Up page.</li>
              <li>Enter your name, email and password.</li>
              <li>Click "Sign Up".</li>
              <li>You'll be redirected to the login page after successful signup.</li>
              <li>To log in,</li>
              <li>Navigate to Login page.</li>
              <li>Enter your registered email and password.</li>
              <li>Click "Login".</li>
              <li>You'll be redirected to the home page after successful login.</li>
            </ul>
          </section>

          {/* User Profile Section */}
          <section id="profile">
            <h2>1.2 User Profile</h2>
            <ul>
              <li>Click the "Profile" icon on header.</li>
              <li>View your profile details: name, email, date joined, recitation streaks, etc.</li>
              <li>Upload or remove your profile picture.</li>
              <li>Click "Logout" to log out of your account.</li>
              <li>Click "Delete Account" to permanently delete your account. <strong>This will remove all your data and cannot be undone.</strong></li>
              <li>To view your progress:</li>
              <li>Click "Dashboard" from the sidebar.</li>
              <li>View your Scoreboard and Progress rate over time.</li>
            </ul>
          </section>

          {/* Recitation Session Section */}
          <section id="recitation">
            <h2>1.3 Recitation Session</h2>
            <ul>
              <li>Open sidebar and click "Quran".</li>
              <li>Select Surah and Ayah range.</li>
              <li>Choose whether to Hide/Show the Quran text.</li>
              <li>Click "Start Recitation".</li>
              <li>Start reciting the selected ayahs aloud.</li>
              <li>The system will:</li>
              <ul>
                <li>Transcribe your recitation in real-time.</li>
                <li>Compare it with the actual verse from the Quran.</li>
                <li>Beeps when a mistake is detected.</li>
                <li>Recite aloud the mistaken words and highlight them in red on Quran.</li>
              </ul>
              <li>Click "Stop Recitation" after finishing.</li>
              <li>View a summary of your performance and mistakes.</li>
              <li>The session data will be saved in your profile history.</li>
            </ul>
          </section>

          {/* Memorization Test Section */}
          <section id="memorization">
            <h2>1.4 Quran Memorization Test</h2>
            <ul>
              <li>Open sidebar and click "Memorization Test".</li>
              <li>Choose a Test Mode (Easy, Medium, Hard).</li>
              <li>Select Surah and Ayah range.</li>
              <li>Click "Start Quiz".</li>
              <li>Complete the test and click "Submit".</li>
              <li>The system will verify answers and display your test score.</li>
              <li>Test results will be saved in your profile history.</li>
            </ul>
          </section>

          {/* Mutashabihat Section */}
          <section id="mutashabihat">
            <h2>1.5 Mutashabihat</h2>
            <ul>
              <li>Open sidebar and click "Mutashabihat".</li>
              <li>Click on any ayah tile.</li>
              <li>A list of similar ayahs will appear below for comparison and study.</li>
            </ul>
          </section>

          {/* Feedback Section */}
          <section id="feedback">
            <h2>1.6 Feedback</h2>
            <ul>
              <li>Open sidebar and click "Feedback".</li>
              <li>Choose a feedback type from the dropdown.</li>
              <li>Write your comments or suggestions in the input box.</li>
              <li>Optionally, rate the system (out of 5).</li>
              <li>Click "Submit Feedback".</li>
            </ul>
          </section>

          {/* Support/Help Section */}
          <section id="support">
            <h2>1.7 Support / Help</h2>
            <ul>
              <li>If you encounter any issues,</li>
              <li>Click "Help" from the sidebar.</li>
              <li>Or raise an issue directly on our GitHub repository:</li>
              <li>
                <a href="https://github.com/Eesha-Maryam/Recite_Right/issues" target="_blank" rel="noreferrer">
                  https://github.com/Eesha-Maryam/Recite_Right/issues
                </a>
              </li>
            </ul>
          </section>
        </main>
      </div>
    </>
  );
};

export default Help;