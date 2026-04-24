import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useLang } from '../../context/LangContext.jsx';
import { MapPin, CalendarDays, Shield, LogOut, LogIn, Sun, Moon, LayoutDashboard } from 'lucide-react';

const LANGS = ['uz', 'ru', 'en'];
const LANG_LABELS = { uz: 'UZ', ru: 'RU', en: 'EN' };

export default function Navbar() {
  const { user, logout, isAdmin, isCEO, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, switchLang, t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">🍽</div>
          TableBook
        </Link>

        {/* Nav links */}
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>
            <MapPin size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            <span>{t('nav.explore')}</span>
          </Link>

          {isAuthenticated && !isCEO && (
            <Link to="/my-bookings" className={isActive('/my-bookings')}>
              <CalendarDays size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              <span>{t('nav.myBookings')}</span>
            </Link>
          )}

          {isAdmin && !isCEO && (
            <Link to="/admin" className={isActive('/admin')}>
              <Shield size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              <span>{t('nav.admin')}</span>
            </Link>
          )}

          {isCEO && (
            <Link to="/ceo" className={isActive('/ceo')}>
              <LayoutDashboard size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              <span>{t('nav.ceo')}</span>
            </Link>
          )}
        </div>

        {/* Right controls */}
        <div className="navbar-controls">
          {/* Language switcher */}
          <div className="lang-switcher" role="group" aria-label="Language switcher">
            {LANGS.map(l => (
              <button
                key={l}
                id={`lang-${l}`}
                className={`lang-btn${lang === l ? ' active' : ''}`}
                onClick={() => switchLang(l)}
                aria-pressed={lang === l}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            id="theme-toggle"
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User area */}
          {isAuthenticated ? (
            <div className="navbar-user">
              <button
                className="navbar-avatar"
                id="profile-nav-btn"
                onClick={() => isCEO ? null : navigate('/profile')}
                title={isCEO ? 'CEO' : t('nav.profile')}
                style={isCEO ? { cursor: 'default', background: 'var(--warning)' } : {}}
              >
                {isCEO ? '👑' : user.name?.charAt(0).toUpperCase()}
              </button>
              <button
                className="icon-btn"
                onClick={logout}
                title={t('nav.signOut')}
                id="logout-btn"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" id="sign-in-btn">
              <LogIn size={14} />
              <span>{t('nav.signIn')}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
