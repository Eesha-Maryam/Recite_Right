import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './header.css';
import { useQuranFont } from '../contexts/FontSizeContext';
import GlobalSearchOverlay from './GlobalSearchOverlay'; // ✅ Make sure this exists

// Helper components
const MenuItem = ({ icon, text, onClick }) => (
  <div className="menu-item" onClick={onClick}>
    <span className="material-icons">{icon}</span>
    <span>{text}</span>
  </div>
);

const SettingsItem = ({ icon, text }) => (
  <div className="settings-item">
    <span className="material-icons">{icon}</span>
    <span>{text}</span>
  </div>
);

const ToggleWithDescription = ({ description, isOn, onToggle, option1, option2 }) => (
  <div className="toggle-section">
    <div className={`toggle-container ${isOn ? 'active' : ''}`} onClick={onToggle}>
      <span className={`toggle-option ${isOn ? 'selected' : ''}`}>{option1}</span>
      <span className={`toggle-option ${!isOn ? 'selected' : ''}`}>{option2}</span>
    </div>
    <p className="toggle-description">{description}</p>
  </div>
);

const QuranFontDisplay = ({ fontSize }) => (
  <div className="quran-font-display" style={{ fontSize: `${fontSize}px` }}>
    بِسْمِ ٱللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
  </div>
);

const SettingsDrawer = ({ isOpen, onClose }) => {
  const { quranFontSize, updateQuranFontSize } = useQuranFont();
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') !== 'dark';
  });

  return (
    <div className={`settings-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-content">
        <div className="drawer-header settings-drawer-header">
          <h2>SETTINGS</h2>
          <button className="close-button" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="settings-section">
          <SettingsItem icon="brightness_6" text="THEME" />
          <ToggleWithDescription
            description="Choose Light or Dark modes using the theme selector."
            isOn={isLightMode}
            onToggle={() => {
              const newMode = !isLightMode;
              setIsLightMode(newMode);
              const body = document.body;

              if (newMode) {
                body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
              } else {
                body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
              }
            }}
            option1="Light"
            option2="Dark"
          />

          <div className="separator"></div>
          <SettingsItem icon="font_download" text="QURAN FONT" />
          <QuranFontDisplay fontSize={quranFontSize} />
          <div className="font-adjuster">
            <span>Font Size</span>
            <div className="adjuster-controls">
              <button onClick={() => updateQuranFontSize(Math.max(16, quranFontSize - 1))}>
                <span className="material-icons">remove</span>
              </button>
              <div className="font-size-display">{quranFontSize}</div>
              <button onClick={() => updateQuranFontSize(Math.min(30, quranFontSize + 1))}>
                <span className="material-icons">add</span>
              </button>
            </div>
          </div>

          <div className="separator"></div>

          <button
            className="reset-button-slider"
            onClick={() => {
              updateQuranFontSize(20);
              document.body.classList.remove('dark-mode');
              localStorage.setItem('theme', 'light');
              setIsLightMode(true);
            }}
          >
            RESET SETTINGS
          </button>
        </div>
      </div>
      <div className="drawer-backdrop" onClick={onClose}></div>
    </div>
  );
};

const MenuDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/home', icon: 'home', text: 'Home' },
    { path: '/dashboard', icon: 'dashboard', text: 'Dashboard' },
    { path: '/quran', icon: 'menu_book', text: 'Quran' },
    { path: '/memorization-test', icon: 'memory', text: 'Memorization Test' },
    { path: '/mutashabihat', icon: 'compare_arrows', text: 'Mutashabihat' },
    { path: '/feedback', icon: 'feedback', text: 'Feedback' },
    { path: '/help', icon: 'help', text: 'Help' },
  ];

  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-content">
        <div className="drawer-header menu-drawer-header">
          <h2>RECITE RIGHT</h2>
          <button className="close-button" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="menu-section">
          <h3 className="sub-heading">MENU</h3>
          <div className="separator"></div>

          {menuItems.map((item) => (
            <React.Fragment key={item.path}>
              <MenuItem
                icon={item.icon}
                text={item.text}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
              />
              <div className="separator"></div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="drawer-backdrop" onClick={onClose}></div>
    </div>
  );
};

// ✅ Final Header component
const Header = ({ transparent = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false); // ✅ new state
  const navigate = useNavigate();
  const location = useLocation();

  const shouldBeTransparent = transparent || location.pathname === '/';

  useEffect(() => {
    if (menuOpen || settingsOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [menuOpen, settingsOpen]);

  return (
    <>
      <header className={`app-header ${shouldBeTransparent ? 'transparent' : ''}`}>
        <div className="header-content">
          <div className="header-left">
            <button className="menu-button" onClick={() => setMenuOpen(true)}>
              <span className="material-icons">menu</span>
            </button>
            <h1 className="app-title">RECITE RIGHT</h1>
          </div>

          <div className="action-buttons">
            <button className="icon-button" onClick={() => setGlobalSearchOpen(true)}>
              <span className="material-icons">search</span>
            </button>
            <button className="icon-button" onClick={() => setSettingsOpen(true)}>
              <span className="material-icons">settings</span>
            </button>
            <button className="icon-button" onClick={() => navigate('/user-profile')}>
              <span className="material-icons">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* ✅ Search overlay appears when triggered */}
      <GlobalSearchOverlay isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </>
  );
};

export default Header;
