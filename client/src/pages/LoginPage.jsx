import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Phone, Shield, ArrowRight, RotateCcw, ChevronRight, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── OTP digit input component ────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([]);

  // Always work from a fixed 6-slot array — never let length vary
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (i, e) => {
    // Strip non-digits, take only the last character typed
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    onChange(next.join(''));
    // Auto-advance focus
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        // Clear current cell
        const next = [...digits];
        next[i] = '';
        onChange(next.join(''));
      } else if (i > 0) {
        // Move to previous cell and clear it
        inputs.current[i - 1]?.focus();
        const next = [...digits];
        next[i - 1] = '';
        onChange(next.join(''));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    onChange(next.join(''));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-1.5 md:gap-2.5 justify-center w-full max-w-[320px] md:max-w-none mx-auto">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          id={`otp-digit-${i}`}
          className="otp-box w-[40px] h-[50px] md:w-[48px] md:h-[56px] text-center text-xl md:text-2xl font-bold rounded-md outline-none transition-colors duration-150"
          autoComplete="one-time-code"
          style={{
            border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            caretColor: 'var(--accent)',
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
      return toast.error(t('login.invalidPhone') || 'Enter a valid phone number');
    }
    setLoading(true);
    try {
      const res = await sendOtp(cleaned);
      setTtl(res.expiresIn || 300);
      setExpired(false);
      setOtp('');
      setStep('otp');
      toast.success(t('login.otpSent') || 'OTP sent! Check your phone');
    } catch (err) {
      toast.error(err.response?.data?.error || t('login.failedSendOtp') || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) return toast.error(t('login.enterFullCode') || 'Enter the full 6-digit code');

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
      toast.error(t('login.incorrectPassphrase') || 'Incorrect passphrase');
    } finally {
      setStaffLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 md:p-5 bg-[var(--bg-primary)]">
      <div className="w-full max-w-[420px]">

        {/* Logo / Brand */}
        <div
          className="text-center mb-6 md:mb-8 cursor-default select-none"
          onClick={handleLogoClick}
        >
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-[28px] mx-auto mb-2 md:mb-3 shadow-[0_8px_32px_rgba(16,185,129,0.35)]"
            style={{ background: 'linear-gradient(135deg, var(--accent), #059669)' }}
          >
            🍽
          </div>
          <h1 className="text-xl md:text-[1.75rem] font-extrabold mb-1">TableBook</h1>
          <p className="text-muted text-xs md:text-sm">{t('login.reservePerfect')}</p>
        </div>

        {/* ── Step: Phone ── */}
        {step === 'phone' && (
          <div className="card animate-slide-up p-5 md:p-8">
            <h2 className="mb-1.5 text-lg md:text-xl">{t('login.signInWithPhone')}</h2>
            <p className="text-muted text-xs md:text-sm mb-4 md:mb-6">
              {t('login.enterNumber')}
            </p>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3 md:gap-4">
              <div className="input-group">
                <label>{t('login.phoneNumber')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-3.5 h-3.5 md:w-4 md:h-4" />
                  <input
                    id="phone-input"
                    className="input w-full pl-8 md:pl-9 text-sm md:text-base"
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
                {loading ? t('login.sending') : t('login.sendCode')}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {showStaff && (
              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] animate-fade-in">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <Shield size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-[10px] md:text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('login.staffAccess')}
                  </span>
                </div>
                <form onSubmit={handleStaffLogin} className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-3 h-3 md:w-3.5 md:h-3.5" />
                    <input
                      id="ceo-passphrase"
                      className="input w-full pl-7 md:pl-8 text-xs md:text-sm"
                      type="password"
                      placeholder={t('login.passphrase')}
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
          <div className="card animate-slide-up p-5 md:p-8">
            <button
              onClick={() => { setStep('phone'); setOtp(''); }}
              className="flex items-center gap-1 bg-none border-none text-[var(--text-muted)] cursor-pointer mb-3 md:mb-4 text-xs md:text-sm p-0"
            >
              ← {t('login.back')}
            </button>

            <h2 className="mb-1.5 text-lg md:text-xl">{t('login.enterCode')}</h2>
            <p className="text-muted text-xs md:text-sm mb-2">
              {t('login.sentTo')} <strong className="text-[var(--text-primary)]">{phone}</strong>
            </p>
            <p className="text-[10px] md:text-xs text-muted mb-4 md:mb-6">
              {t('login.devHint')}
            </p>

            <form onSubmit={handleVerifyOtp} className="flex flex-col items-center gap-4 md:gap-5">
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              <button
                className="btn btn-primary btn-lg w-full"
                type="submit"
                disabled={loading || otp.replace(/\D/g, '').length < 6}
                id="verify-otp-btn"
                style={{
                  opacity: (!loading && otp.replace(/\D/g, '').length === 6) ? 1 : 0.45,
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                  cursor: (!loading && otp.replace(/\D/g, '').length === 6) ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? t('login.verifying') : t('login.verifyCode')}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <span className="text-xs text-muted">{t('login.codeExpiresIn')}</span>
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
                      <RotateCcw size={12} /> {t('login.resendCode')}
                    </button>
                  )
              }
            </div>

            {expired && (
              <p className="text-xs text-center mt-2" style={{ color: 'var(--danger, #ef4444)' }}>
                {t('login.codeExpired')}
              </p>
            )}
          </div>
        )}

        {/* ── Step: Name (new users only) ── */}
        {step === 'name' && (
          <div className="card animate-slide-up p-5 md:p-8">
            <div className="text-center mb-4 md:mb-5">
              <div className="text-[28px] md:text-4xl mb-2">👋</div>
              <h2 className="text-lg md:text-xl mb-1">{t('login.welcomeNew')}</h2>
              <p className="text-muted text-xs md:text-sm">{t('login.whatShouldWeCallYou')}</p>
            </div>

            <form onSubmit={handleSaveName} className="flex flex-col gap-3 md:gap-4">
              <div className="input-group">
                <label className="text-xs md:text-sm">{t('login.yourName')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-3.5 h-3.5 md:w-4 md:h-4" />
                  <input
                    id="name-input"
                    className="input w-full pl-8 md:pl-9 text-sm md:text-base"
                    placeholder={t('login.fullName')}
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
                {loading ? t('login.saving') : t('login.letsGo')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                {t('login.skipForNow')}
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
