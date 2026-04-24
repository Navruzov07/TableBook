import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
        toast.success(t('login.accountCreated'));
      } else {
        await login(form.email, form.password);
        toast.success(t('login.welcomeBack'));
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: 440 }}>
        <h2 style={{ marginBottom: 8 }}>{isRegister ? t('login.createAccount') : t('login.welcome')}</h2>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
          {isRegister ? t('login.registerSub') : t('login.signInSub')}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRegister && (
            <div className="input-group">
              <label>{t('login.name')}</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input w-full"
                  style={{ paddingLeft: 36 }}
                  placeholder={t('login.name')}
                  value={form.name}
                  onChange={update('name')}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>{t('login.email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input w-full"
                style={{ paddingLeft: 36 }}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>{t('login.password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input w-full"
                style={{ paddingLeft: 36 }}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update('password')}
                required
                minLength={4}
              />
            </div>
          </div>

          {isRegister && (
            <div className="input-group">
              <label>{t('login.phone')}</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input w-full"
                  style={{ paddingLeft: 36 }}
                  placeholder="+998 90 000 00 00"
                  value={form.phone}
                  onChange={update('phone')}
                />
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-lg w-full" disabled={loading} type="submit">
            {loading ? t('login.pleaseWait') : (isRegister ? t('login.register') : t('login.signIn'))}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-center text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
          {isRegister ? t('login.alreadyHave') : t('login.dontHave')}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
          >
            {isRegister ? t('login.signIn') : t('login.register')}
          </button>
        </p>
      </div>
    </div>
  );
}
