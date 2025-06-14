import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/homepage';
import LoginPage from './pages/login';
import SignUpPage from './pages/signup';
import ResetPasswordPage from './pages/reset-password-page';
import ForgotPassword from './pages/forgot-password';
import Dashboard from './pages/dashboard';
import Feedback from './pages/feedback';
import Quran from './pages/quran';
import QuizPage from './pages/QuizPage';
import Mutashabihat from './pages/mutashabihat';
import Help from './pages/help';
import MemorizationTest from './pages/memorization-test'; // ✅ Renamed to PascalCase
import SurahSelection from './pages/surah-selection';
import EmailVerificationPage from './pages/EmailVerificationPage';
import UserProfile from './pages/user-profile';
import { ThemeProvider } from './ThemeContext'; // ✅ Required Theme Provider

function App({ authenticated, setAuthenticated }) {
  return (
    <ThemeProvider> {/* ✅ Wrapping all components in ThemeProvider */}
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={authenticated ? "/home" : "/login"} replace />}
          />
          <Route path="/home" element={authenticated ? <HomePage /> : <Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              !authenticated ? (
                <LoginPage setAuthenticated={setAuthenticated} />
              ) : (
                <Navigate to="/home" />
              )
            }
          />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />  
          <Route path="/dashboard" element={authenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/feedback" element={<Feedback />} />  
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/email-verified-success" element={<EmailVerificationPage />} />
          <Route path="/email-verification-failed" element={<EmailVerificationPage />} />
          <Route path="/quran" element={<Quran/>} /> 
          <Route path="/mutashabihat" element={<Mutashabihat/>} /> 
          <Route path="/help" element={<Help/>} /> 
          <Route path="/memorization-test" element={authenticated ? <MemorizationTest /> : <Navigate to="/login" />} />
          <Route path="/surah-selection" element={authenticated ? <SurahSelection /> : <Navigate to="/login" />} />
          <Route path="/quiz" element={authenticated ? <QuizPage /> : <Navigate to="/login" />} />
          <Route
            path="/user-profile"
            element={<UserProfile setAuthenticated={setAuthenticated} />}
          />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
