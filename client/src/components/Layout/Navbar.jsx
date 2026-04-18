import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { MapPin, CalendarDays, Shield, LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">🍽</div>
          TableBook
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>
            <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            <span>Explore</span>
          </Link>

          {isAuthenticated && (
            <Link to="/my-bookings" className={isActive('/my-bookings')}>
              <CalendarDays size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              <span>My Bookings</span>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className={isActive('/admin')}>
              <Shield size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              <span>Admin</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <button onClick={logout} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className={`btn btn-primary btn-sm`}>
              <LogIn size={14} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
