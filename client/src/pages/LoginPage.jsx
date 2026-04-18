import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
        toast.success('Account created!');
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: 440 }}>
        <h2 style={{ marginBottom: 8 }}>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
          {isRegister ? 'Join TableBook to start reserving' : 'Sign in to manage your bookings'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRegister && (
            <div className="input-group">
              <label>Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input w-full"
                  style={{ paddingLeft: 36 }}
                  placeholder="Your name"
                  value={form.name}
                  onChange={update('name')}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
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
            <label>Password</label>
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
            <>
              <div className="input-group">
                <label>Phone (optional)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input w-full"
                    style={{ paddingLeft: 36 }}
                    placeholder="+1-555-0000"
                    value={form.phone}
                    onChange={update('phone')}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Account Type</label>
                <select className="input" value={form.role} onChange={update('role')}>
                  <option value="customer">Customer</option>
                  <option value="admin">Restaurant Admin</option>
                </select>
              </div>
            </>
          )}

          <button className="btn btn-primary btn-lg w-full" disabled={loading} type="submit">
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-center text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>

        <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p className="text-xs text-muted" style={{ marginBottom: 6 }}>Demo Credentials</p>
          <p className="text-xs">Admin: admin@bellaitalia.com / admin123</p>
          <p className="text-xs">Customer: john@example.com / user123</p>
        </div>
      </div>
    </div>
  );
}
