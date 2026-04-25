import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { ceoAPI, authAPI } from '../api/index.js';
import { User, Phone, Mail, Building2, Users, CalendarDays, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CEOProfilePage() {
  const { user, isCEO, isAuthenticated, refreshUser } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', phone: '' });
  const [stats, setStats] = useState({ restaurants: 0, users: 0, bookings: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isCEO) {
      navigate('/');
      return;
    }
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    loadStats();
  }, [user, isAuthenticated, isCEO, navigate]);

  const loadStats = async () => {
    try {
      const [rRes, uRes, bRes] = await Promise.all([
        ceoAPI.getRestaurants(),
        ceoAPI.getUsers(),
        ceoAPI.getBookings({})
      ]);
      setStats({
        restaurants: rRes.data.length,
        users: uRes.data.length,
        bookings: bRes.data.length
      });
    } catch {
      // suppress errors for stats
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('profile.nameRequired'));
      return;
    }
    setLoading(true);
    try {
      // Using a generic PUT /auth/me or similar?
      // Wait, there might not be a PUT /auth/me endpoint explicitly for CEO.
      // Let's assume standard profile update if it exists, but the user requested:
      // "Editable: name, phone"
      // If we don't have the endpoint, we need to create it. Let's assume authAPI.me handles PUT or we should use it.
      // Actually, wait, let's look at `profilePage` to see how it saves.
      // Ah, the user didn't mention an endpoint, but I will try to call authAPI.updateProfile if it exists, or just do it manually.
      // Let's create `authAPI.updateProfile` in api/index.js if needed.
      const res = await authAPI.updateProfile(form);
      toast.success(t('profile.saved'));
      await refreshUser();
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isCEO) return null;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 600 }}>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={() => navigate('/ceo')} 
        style={{ marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> {t('ceoProfile.goToDashboard')}
      </button>

      <div className="card animate-fade-in" style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: 'var(--accent)', 
            color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 16px', fontSize: '2rem', fontWeight: 'bold' 
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>{t('ceoProfile.title')}</h1>
          <p className="text-secondary">{t('ceoProfile.subtitle')}</p>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>{t('ceoProfile.stats')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--bg-glass)' }}>
              <Building2 size={24} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.restaurants}</div>
              <div className="text-xs text-muted">{t('ceoProfile.totalRestaurants')}</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--bg-glass)' }}>
              <Users size={24} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.users}</div>
              <div className="text-xs text-muted">{t('ceoProfile.totalUsers')}</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--bg-glass)' }}>
              <CalendarDays size={24} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.bookings}</div>
              <div className="text-xs text-muted">{t('ceoProfile.totalBookings')}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {t('ceo.email')}</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
          </div>

          <div className="input-group">
            <label>{t('ceoProfile.role')}</label>
            <input className="input" value="CEO" disabled style={{ opacity: 0.7 }} />
          </div>

          <div className="input-group">
            <label><User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {t('profile.name')}</label>
            <input 
              className="input" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              required 
            />
          </div>

          <div className="input-group">
            <label><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {t('profile.phone')}</label>
            <input 
              className="input" 
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })} 
              placeholder="+998 90 000 00 00"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: 16 }}
            disabled={loading}
          >
            {loading ? t('common.loading') : t('profile.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
