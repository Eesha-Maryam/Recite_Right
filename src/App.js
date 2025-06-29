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
import MutashabihatDetail from './pages/MutashabihatDetail';
import Help from './pages/help';
import MemorizationTest from './pages/memorization-test-mode';
import SurahSelection from './pages/surah-selection';
import EmailVerificationPage from './pages/EmailVerificationPage';
import UserProfile from './pages/user-profile';
import { ThemeProvider } from './ThemeContext';
import PrivateRoute from './components/PrivateRoute'; 
import { QuranFontProvider } from './contexts/FontSizeContext';
import MistakeLog from './pages/mistake-log';
function App({ authenticated, setAuthenticated }) {
  return (
    <ThemeProvider>
      <QuranFontProvider> {/* ✅ Wrap everything here */}
        <div className="app">
          <Routes>
            <Route path="/" element={<Navigate to={authenticated ? "/home" : "/login"} replace />} />

            <Route path="/login" element={!authenticated ? <LoginPage setAuthenticated={setAuthenticated} /> : <Navigate to="/home" />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/email-verified-success" element={<EmailVerificationPage />} />
            <Route path="/email-verification-failed" element={<EmailVerificationPage />} />

            {/* 🔒 Protected Routes */}
            <Route path="/home" element={<PrivateRoute authenticated={authenticated}><HomePage /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute authenticated={authenticated}><Dashboard /></PrivateRoute>} />
            <Route path="/feedback" element={<PrivateRoute authenticated={authenticated}><Feedback /></PrivateRoute>} />
            <Route path="/quran" element={<PrivateRoute authenticated={authenticated}><Quran /></PrivateRoute>} />
            <Route path="/mutashabihat" element={<PrivateRoute authenticated={authenticated}><Mutashabihat /></PrivateRoute>} />
            <Route path="/mutashabihat/:id" element={<PrivateRoute authenticated={authenticated}><MutashabihatDetail /></PrivateRoute>} /> 
            <Route path="/help" element={<PrivateRoute authenticated={authenticated}><Help /></PrivateRoute>} />
            <Route path="/memorization-test" element={<PrivateRoute authenticated={authenticated}><MemorizationTest /></PrivateRoute>} />
            <Route path="/surah-selection" element={<PrivateRoute authenticated={authenticated}><SurahSelection /></PrivateRoute>} />
            <Route path="/quiz" element={<PrivateRoute authenticated={authenticated}><QuizPage /></PrivateRoute>} />
            <Route path="/user-profile" element={<PrivateRoute authenticated={authenticated}><UserProfile setAuthenticated={setAuthenticated} /></PrivateRoute>} />
          <Route path="/mistake-log" element={<MistakeLog />} />
          </Routes>
        </div>
      </QuranFontProvider>
    </ThemeProvider>
  );
}

export default App;
