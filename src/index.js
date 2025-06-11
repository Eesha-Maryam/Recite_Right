import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

import App from './App';
import { isUserAuthenticated } from './utils/auth';

const Root = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await isUserAuthenticated();
      setAuthenticated(result);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <Router>
      <App authenticated={authenticated} setAuthenticated={setAuthenticated} />
    </Router>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

reportWebVitals();
