import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Trash2, Star, MapPin, ChevronRight, Bot } from 'lucide-react';
import { useLang } from '../../context/LangContext.jsx';
import { getTranslatedField } from '../../utils/translate.js';
import { useAIAssistant } from './useAIAssistant.js';

// ─── Reason badges ─────────────────────────────────────────────────────────
const ATMOSPHERE_EMOJI = { romantic: '💑', family: '👨‍👩‍👧', business: '💼', quiet: '🤫', outdoor: '🌿' };
const REASON_LABELS = {
  cuisine:   { en: 'Cuisine match', uz: 'Taom turi mos', ru: 'Кухня подходит' },
  atmosphere:{ en: 'Great atmosphere', uz: 'Atmosfera mos', ru: 'Отличная атмосфера' },
  seats:     { en: 'Enough seats', uz: 'Yetarli joy', ru: 'Достаточно мест' },
  available: { en: 'Tables free', uz: 'Stollar mavjud', ru: 'Столы свободны' },
  budget:    { en: 'Fits budget', uz: 'Byudjetga mos', ru: 'Подходит по бюджету' },
};

function ReasonBadge({ reason, lang }) {
  const label = REASON_LABELS[reason.key]?.[lang] || reason.key;
  const emoji = reason.key === 'atmosphere' ? (ATMOSPHERE_EMOJI[reason.value] || '✨') : null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 'var(--radius-full)',
      background: 'var(--accent-soft)', color: 'var(--accent)',
      fontSize: '0.7rem', fontWeight: 700, border: '1px solid var(--accent)',
      marginRight: 4, marginBottom: 4,
    }}>
      {emoji && <span>{emoji}</span>}
      {label}
    </span>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────
function ResultCard({ item, lang, t, onView, onBook }) {
  const { restaurant, reasons, freeTablesCount, affordableItems } = item;
  const name = getTranslatedField(restaurant.name, lang);

  return (
    <div className="ai-result-card">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={name}
            style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent), #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>🍽</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--warning)', fontWeight: 800, fontSize: '0.78rem', flexShrink: 0 }}>
              <Star size={11} fill="currentColor" />{restaurant.rating}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 4 }}>
            <MapPin size={10} />{restaurant.address}
          </div>
          <span style={{
            display: 'inline-block', padding: '1px 7px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '0.65rem',
            fontWeight: 800, border: '1px solid var(--accent)', textTransform: 'uppercase',
            letterSpacing: '0.04em', marginBottom: 6,
          }}>
            {restaurant.cuisineType}
          </span>

          {/* Extra info */}
          {(freeTablesCount || affordableItems) && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {freeTablesCount ? `✅ ${freeTablesCount} ${t('ai.tablesAvail')}` : ''}
              {affordableItems ? `  🍴 ${affordableItems} affordable items` : ''}
            </div>
          )}

          {/* Reason badges */}
          {reasons.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {reasons.slice(0, 3).map((r, i) => (
                <ReasonBadge key={i} reason={r} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={() => onView(restaurant.id)}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, fontSize: '0.72rem' }}
          id={`ai-view-${restaurant.id}`}
        >
          {t('ai.viewRestaurant')} <ChevronRight size={12} />
        </button>
        <button
          onClick={() => onBook(restaurant.id)}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, fontSize: '0.72rem' }}
          id={`ai-book-${restaurant.id}`}
        >
          {t('ai.bookNow')}
        </button>
      </div>
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────
function Message({ msg, lang, t, onView, onBook }) {
  if (msg.role === 'user') {
    return (
      <div className="ai-message ai-message-user">
        <span>{msg.text}</span>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="ai-message ai-message-bot">
      <div className="ai-bot-avatar"><Bot size={14} /></div>
      <div style={{ flex: 1 }}>
        {msg.text && (
          <p style={{ fontSize: '0.82rem', lineHeight: 1.55, whiteSpace: 'pre-line', marginBottom: msg.results ? 10 : 0 }}>
            {msg.text}
          </p>
        )}
        {msg.results && msg.results.map((item, i) => (
          <ResultCard key={i} item={item} lang={lang} t={t} onView={onView} onBook={onBook} />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const { lang, t } = useLang();
  const { processQuery } = useAIAssistant();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const greetingShown = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Show greeting when first opened
  useEffect(() => {
    if (open && !greetingShown.current) {
      greetingShown.current = true;
      setMessages([{ id: 0, role: 'bot', text: t('ai.greeting') }]);
    }
  }, [open, t]);

  // Refocus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const result = await processQuery(text, lang, t);
      if (!result) return; // cancelled

      if (result.type === 'results') {
        const intro = buildIntroText(result.intent, lang, t, result.results.length);
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'bot',
          text: intro,
          results: result.results,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'bot',
          text: result.text,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'bot',
        text: t('ai.errorFetch'),
      }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, lang, t, processQuery]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleView = (id) => navigate(`/restaurant/${id}`);
  const handleBook = (id) => { navigate(`/restaurant/${id}`); setOpen(false); };

  const handleClear = () => {
    greetingShown.current = false;
    setMessages([{ id: 0, role: 'bot', text: t('ai.greeting') }]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="ai-assistant-fab"
        className={`ai-fab ${open ? 'ai-fab-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={t('ai.buttonTitle')}
        title={t('ai.buttonTitle')}
      >
        {open
          ? <X size={22} />
          : <>
              <Sparkles size={20} />
              <span className="ai-fab-label">{t('ai.buttonTitle')}</span>
            </>
        }
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="ai-panel" role="dialog" aria-label={t('ai.buttonTitle')} id="ai-assistant-panel">
          {/* Header */}
          <div className="ai-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="ai-header-icon">
                <Sparkles size={14} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('ai.buttonTitle')}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>TableBook</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="icon-btn"
                onClick={handleClear}
                title={t('ai.clearChat')}
                style={{ width: 30, height: 30 }}
              >
                <Trash2 size={14} />
              </button>
              <button
                className="icon-btn"
                onClick={() => setOpen(false)}
                title={t('ai.close')}
                style={{ width: 30, height: 30 }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map(msg => (
              <Message
                key={msg.id}
                msg={msg}
                lang={lang}
                t={t}
                onView={handleView}
                onBook={handleBook}
              />
            ))}
            {thinking && (
              <div className="ai-message ai-message-bot">
                <div className="ai-bot-avatar"><Bot size={14} /></div>
                <div className="ai-thinking">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="ai-input-bar">
            <input
              ref={inputRef}
              className="input ai-input"
              placeholder={t('ai.placeholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={thinking}
              id="ai-assistant-input"
              maxLength={200}
            />
            <button
              className="btn btn-primary ai-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              aria-label="Send"
              id="ai-assistant-send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Build intro text for results ─────────────────────────────────────────
function buildIntroText(intent, lang, t, count) {
  const intros = {
    en: `Found ${count} restaurant${count !== 1 ? 's' : ''} for you 🎯`,
    uz: `Siz uchun ${count} ta restoran topildi 🎯`,
    ru: `Найдено ${count} ресторан${count !== 1 ? 'а' : ''} для вас 🎯`,
  };
  return intros[lang] || intros.en;
}
