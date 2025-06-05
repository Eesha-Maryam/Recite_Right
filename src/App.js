import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/homepage';
import LoginPage from './pages/login';  // Import the LoginPage component
import SignUpPage from './pages/signup';  // Import the LoginPage component
import ResetPasswordPage from './pages/reset-password-page';
import ForgotPassword from './pages/forgot-password';
import Dashboard from './pages/dashboard';
import Feedback from './pages/feedback';
import Quran from './pages/quran';
import Mutashabihat from './pages/mutashabihat';
import Help from './pages/help';
import Memorization_test from './pages/memorization-test';
import SurahSelection from './pages/surah-selection';
import EmailVerificationPage from './pages/EmailVerificationPage';
import UserProfile from './pages/user-profile';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/home" element={<HomePage />} />  
          <Route path="/login" element={<LoginPage />} />  
          <Route path="/signup" element={<SignUpPage />} />  
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />  
          <Route path="/dashboard" element={<Dashboard/>} /> 
          <Route path="/feedback" element={<Feedback />} />  
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/email-verified-success" element={<EmailVerificationPage />} />
          <Route path="/email-verification-failed" element={<EmailVerificationPage />} />
          <Route path="/quran" element={<Quran/>} /> 
          <Route path="/mutashabihat" element={<Mutashabihat/>} /> 
          <Route path="/help" element={<Help/>} /> 
          <Route path="/memorization-test" element={<Memorization_test/>} /> 
         <Route path="/surah-selection" element={<SurahSelection/>} /> 
         <Route path="/user-profile" element={<UserProfile/>} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;
