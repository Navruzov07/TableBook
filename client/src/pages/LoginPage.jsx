import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Phone, Shield, ArrowRight, RotateCcw, ChevronRight, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── OTP digit input component ────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, idx) => (idx === i ? val : d));
    // pad to 6
    while (next.length < 6) next.push('');
    onChange(next.join(''));
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const next = digits.map((d, idx) => (idx === i - 1 ? '' : d));
      onChange(next.join(''));
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ''));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          id={`otp-digit-${i}`}
          style={{
            width: 48,
            height: 56,
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            border: `2px solid ${digits[i] ? 'var(--accent)' : 'var(--border)'}`,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.15s ease',
            fontFamily: 'inherit',
          }}
        />
      ))}
    </div>
  );
}

// ─── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
    if (!seconds) return;
    const id = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) { clearInterval(id); onExpire?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]); // eslint-disable-line

  if (!left) return null;
  const m = Math.floor(left / 60);
  const s = left % 60;
  return (
    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      {m}:{s.toString().padStart(2, '0')}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const [step, setStep] = useState('phone');  // 'phone' | 'otp' | 'name'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [ttl, setTtl] = useState(0);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // CEO staff access
  const [showStaff, setShowStaff] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  const { sendOtp, verifyOtp, ceoLogin } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  // Triple-click the logo to reveal CEO access panel
  const handleLogoClick = () => {
    clickCount.current += 1;
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 600);
    if (clickCount.current >= 3) {
      clickCount.current = 0;
      setShowStaff(prev => !prev);
    }
  };

  // Step 1: send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (!cleaned || cleaned.length < 8) {
      return toast.error('Enter a valid phone number');
    }
    setLoading(true);
    try {
      const res = await sendOtp(cleaned);
      setTtl(res.expiresIn || 300);
      setExpired(false);
      setOtp('');
      setStep('otp');
      toast.success('OTP sent! Check your phone (or server console in dev mode)');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) return toast.error('Enter the full 6-digit code');

    setLoading(true);
    try {
      const userData = await verifyOtp(phone.replace(/[\s\-()]/g, ''), code, name || undefined);

      // New users with no name — ask for name
      if (!userData.name || userData.name.trim() === '') {
        setIsNewUser(true);
        setStep('name');
        return;
      }

      toast.success('Welcome to TableBook! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (step === 'otp' && otp.replace(/\D/g, '').length === 6) {
      handleVerifyOtp();
    }
  }, [otp]); // eslint-disable-line

  // Step 3: save name (for new users)
  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');
    setLoading(true);
    try {
      // Re-verify with name so the server upserts it
      const code = otp.replace(/\D/g, '');
      // Name has already been submitted — just update profile
      const { authAPI } = await import('../api/index.js');
      await authAPI.updateProfile({ name: name.trim() });
      toast.success(`Welcome, ${name.trim()}! 🎉`);
      navigate('/');
    } catch {
      // Profile update failed silently — still logged in
      toast.success('Welcome to TableBook! 🎉');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await sendOtp(phone.replace(/[\s\-()]/g, ''));
      setTtl(res.expiresIn || 300);
      setExpired(false);
      setOtp('');
      toast.success('New code sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  // CEO staff login
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    setStaffLoading(true);
    try {
      await ceoLogin(passphrase.trim());
      toast.success('Welcome, CEO 👑');
      navigate('/ceo');
    } catch {
      toast.error('Incorrect passphrase');
    } finally {
      setStaffLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'var(--bg-primary)'
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo / Brand */}
        <div
          style={{ textAlign: 'center', marginBottom: 32, cursor: 'default', userSelect: 'none' }}
          onClick={handleLogoClick}
        >
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, margin: '0 auto 12px',
              boxShadow: '0 8px 32px rgba(16,185,129,0.35)'
            }}
          >
            🍽
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>TableBook</h1>
          <p className="text-muted text-sm">Reserve your perfect table</p>
        </div>

        {/* ── Step: Phone ── */}
        {step === 'phone' && (
          <div className="card animate-slide-up" style={{ padding: 32 }}>
            <h2 style={{ marginBottom: 6, fontSize: '1.25rem' }}>Sign in with phone</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
              Enter your number — we'll send a one-time code
            </p>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Phone number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="phone-input"
                    className="input w-full"
                    style={{ paddingLeft: 36 }}
                    type="tel"
                    placeholder="+998 90 000 00 00"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg w-full"
                type="submit"
                disabled={loading}
                id="send-otp-btn"
              >
                {loading ? 'Sending...' : 'Send Code'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Staff Access — hidden, revealed by triple-clicking the logo */}
            {showStaff && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.03)',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Shield size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-xs" style={{ fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Staff Access
                  </span>
                </div>
                <form onSubmit={handleStaffLogin} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="ceo-passphrase"
                      className="input w-full"
                      style={{ paddingLeft: 30, fontSize: '0.875rem' }}
                      type="password"
                      placeholder="Passphrase"
                      value={passphrase}
                      onChange={e => setPassphrase(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={staffLoading}
                    style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
                    id="staff-login-btn"
                  >
                    {staffLoading ? '...' : <ChevronRight size={16} />}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Step: OTP ── */}
        {step === 'otp' && (
          <div className="card animate-slide-up" style={{ padding: 32 }}>
            <button
              onClick={() => { setStep('phone'); setOtp(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', padding: 0 }}
            >
              ← Back
            </button>

            <h2 style={{ marginBottom: 6, fontSize: '1.25rem' }}>Enter your code</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 8 }}>
              Sent to <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong>
            </p>
            <p className="text-xs text-muted" style={{ marginBottom: 24 }}>
              (In development: check your <strong>server console</strong> for the code)
            </p>

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              <button
                className="btn btn-primary btn-lg w-full"
                type="submit"
                disabled={loading || otp.replace(/\D/g,'').length < 6}
                id="verify-otp-btn"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <span className="text-xs text-muted">Code expires in</span>
              {!expired
                ? <Countdown seconds={ttl} onExpire={() => setExpired(true)} />
                : (
                    <button
                      className="text-xs"
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                      onClick={handleResend}
                      disabled={loading}
                      id="resend-otp-btn"
                    >
                      <RotateCcw size={12} /> Resend code
                    </button>
                  )
              }
            </div>

            {expired && (
              <p className="text-xs text-center mt-2" style={{ color: 'var(--danger, #ef4444)' }}>
                Code expired. Please request a new one.
              </p>
            )}
          </div>
        )}

        {/* ── Step: Name (new users only) ── */}
        {step === 'name' && (
          <div className="card animate-slide-up" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>Welcome!</h2>
              <p className="text-muted text-sm">You're new here. What should we call you?</p>
            </div>

            <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Your name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="name-input"
                    className="input w-full"
                    style={{ paddingLeft: 36 }}
                    placeholder="Full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg w-full"
                type="submit"
                disabled={loading || !name.trim()}
                id="save-name-btn"
              >
                {loading ? 'Saving...' : "Let's Go 🚀"}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Skip for now
              </button>
            </form>
          </div>
        )}

        {/* Step indicator dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {['phone', 'otp', 'name'].map((s) => (
            <div
              key={s}
              style={{
                width: step === s ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: step === s ? 'var(--accent)' : 'var(--border)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
