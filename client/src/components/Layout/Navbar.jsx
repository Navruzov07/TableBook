import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useLang } from '../../context/LangContext.jsx';
import { MapPin, CalendarDays, Shield, LogOut, LogIn, Sun, Moon, LayoutDashboard, Home, Search, User } from 'lucide-react';

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
    <nav className="navbar h-[56px] md:h-[68px]">
      <div className="container h-full flex items-center justify-between gap-2 md:gap-4">
        {/* Brand */}
        <Link to="/" className="navbar-brand text-[1.1rem] md:text-[1.3rem] gap-2 md:gap-2.5">
          <div className="navbar-brand-icon !w-6 !h-6 md:!w-[34px] md:!h-[34px] !text-sm md:!text-base">🍽</div>
          TableBook
        </Link>

        {/* Nav links */}
        <div className="navbar-links hidden md:flex">
          {(!user || user.role === 'customer') && (
            <Link to="/" className={isActive('/')}>
              <MapPin size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              <span>{t('nav.explore')}</span>
            </Link>
          )}

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
        <div className="navbar-controls gap-1.5 md:gap-2">
          {/* Language switcher */}
          <div className="lang-switcher hidden md:flex" role="group" aria-label="Language switcher">
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
            <div className="navbar-user gap-1 md:gap-1.5">
              <button
                className="navbar-avatar !w-8 !h-8 md:!w-9 md:!h-9 !text-sm md:!text-[0.9rem]"
                id="profile-nav-btn"
                onClick={() => navigate(isCEO ? '/ceo/profile' : '/profile')}
                title={isCEO ? 'CEO Profile' : t('nav.profile')}
                style={isCEO ? { background: 'var(--warning)' } : {}}
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
            <Link to="/login" className="btn btn-primary btn-sm px-2.5 py-1.5 md:px-3.5 md:py-[7px] text-[11px] md:text-xs" id="sign-in-btn">
              <LogIn size={14} className="w-3.5 md:w-4" />
              <span>{t('nav.signIn')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[var(--navbar-bg)] border-t border-[var(--border)] flex justify-around items-center py-2 z-[1000] md:hidden backdrop-blur-md pb-[max(8px,env(safe-area-inset-bottom))]">
        <Link to="/" className={`flex flex-col items-center gap-1 p-2 ${isActive('/') ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
          <Home size={20} />
          <span className="text-[10px] font-semibold">{t('nav.explore') || 'Home'}</span>
        </Link>
        <button 
          onClick={() => {
            if (location.pathname !== '/') {
              navigate('/');
            }
            setTimeout(() => document.getElementById('restaurant-search')?.focus(), 100);
          }}
          className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
        >
          <Search size={20} />
          <span className="text-[10px] font-semibold">{t('common.search') || 'Search'}</span>
        </button>
        {isAuthenticated ? (
          <Link to={isCEO ? '/ceo/profile' : '/profile'} className={`flex flex-col items-center gap-1 p-2 ${location.pathname.includes('profile') ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
            <User size={20} />
            <span className="text-[10px] font-semibold">{t('nav.profile')}</span>
          </Link>
        ) : (
          <Link to="/login" className={`flex flex-col items-center gap-1 p-2 ${isActive('/login') ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
            <LogIn size={20} />
            <span className="text-[10px] font-semibold">{t('nav.signIn')}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
