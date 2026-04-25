import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { User, Phone, Save, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', surname: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    // Load from localStorage (profile data separate from auth user)
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      setForm(JSON.parse(saved));
    } else {
      // Pre-fill from auth user if available
      setForm(f => ({
        ...f,
        name: user?.name || '',
        phone: user?.phone || '',
      }));
    }
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('profile.nameRequired');
    if (!form.phone.trim()) e.phone = t('profile.phoneRequired');
    else if (!/^\+?[\d\s\-()]{7,}$/.test(form.phone.trim())) e.phone = t('profile.phoneInvalid');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400)); // simulate async save
    localStorage.setItem('userProfile', JSON.stringify(form));
    setSaving(false);
    toast.success(t('profile.saved'));
  };

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 520 }}>

      {/* Back button */}
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 24, gap: 6 }}
        onClick={() => navigate(-1)}
      >
        <ChevronLeft size={16} /> {t('profile.back')}
      </button>

      {/* Avatar + title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="profile-avatar-large" id="profile-avatar">
          {form.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h1 style={{ marginTop: 16, marginBottom: 4 }}>{t('profile.title')}</h1>
        <p className="text-muted text-sm">{t('profile.subtitle')}</p>
      </div>

      {/* Profile card */}
      <div className="card animate-slide-up">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Name */}
          <div className="input-group">
            <label htmlFor="profile-name">{t('profile.name')} *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="profile-name"
                className={`input w-full${errors.name ? ' input-error' : ''}`}
                style={{ paddingLeft: 40 }}
                placeholder={t('profile.namePlaceholder')}
                value={form.name}
                onChange={update('name')}
              />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Surname */}
          <div className="input-group">
            <label htmlFor="profile-surname">{t('profile.surname')}</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="profile-surname"
                className="input w-full"
                style={{ paddingLeft: 40 }}
                placeholder={t('profile.surnamePlaceholder')}
                value={form.surname}
                onChange={update('surname')}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="input-group">
            <label htmlFor="profile-phone">{t('profile.phone')} *</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="profile-phone"
                className={`input w-full${errors.phone ? ' input-error' : ''}`}
                style={{ paddingLeft: 40 }}
                placeholder={t('profile.phonePlaceholder')}
                value={form.phone}
                onChange={update('phone')}
                type="tel"
              />
            </div>
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          {/* Email (read-only from auth) */}
          {user?.email && (
            <div className="input-group">
              <label>Email</label>
              <input
                className="input w-full"
                value={user.email}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
          )}

          <button
            id="profile-save-btn"
            className="btn btn-primary btn-lg w-full"
            type="submit"
            disabled={saving}
          >
            {saving ? '...' : <><Save size={16} /> {t('profile.save')}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
