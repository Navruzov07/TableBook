import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Calendar, Clock, Users, MapPin, X, ShoppingBag, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyBookingsPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadBookings();
  }, [isAuthenticated]);

  const loadBookings = () => {
    bookingAPI.mine().then(res => {
      setBookings(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleCancel = async (id) => {
    if (!confirm(t('myBookings.cancelConfirm'))) return;
    try {
      await bookingAPI.cancel(id);
      toast.success(t('myBookings.cancelBooking'));
      loadBookings();
    } catch {
      toast.error(t('myBookings.cancelFail'));
    }
  };

  const statusBadge = (status) => {
    const map = { confirmed: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger', completed: 'badge-accent' };
    return <span className={`badge ${map[status] || 'badge-accent'}`}>{status}</span>;
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ paddingTop: 16, maxWidth: 800 }}>
      <h1 style={{ marginBottom: 4 }}>{t('myBookings.title')}</h1>
      <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
        {bookings.length} {t('myBookings.count')}
      </p>

      {bookings.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📅</p>
          <h3>{t('myBookings.noBookings')}</h3>
          <p className="text-muted text-sm mt-1">{t('myBookings.noBookingsHint')}</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate('/')}>
            {t('myBookings.explore')} <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map(b => (
            <div key={b.id} className="card animate-fade-in" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{b.restaurant?.name}</h3>
                  <p className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} /> {b.restaurant?.address}
                  </p>
                </div>
                {statusBadge(b.status)}
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color="var(--accent)" /> {b.bookingDate}
                </span>
                <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="var(--accent)" /> {b.startTime} – {b.endTime}
                </span>
                <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="var(--accent)" /> {b.guestCount}
                </span>
                <span className="text-sm text-muted">🪑 {b.table?.label} ({b.table?.seatCount})</span>
              </div>

              {b.notes && (
                <p className="text-xs text-muted" style={{ marginBottom: 8, fontStyle: 'italic' }}>
                  📝 {b.notes}
                </p>
              )}

              {b.preorderItems?.length > 0 && (
                <div style={{ padding: 10, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: 12, border: '1px solid var(--border)' }}>
                  <p className="text-xs text-muted" style={{ marginBottom: 6, fontWeight: 600 }}>
                    <ShoppingBag size={11} style={{ verticalAlign: 'middle' }} /> {t('myBookings.preOrder')}
                  </p>
                  {b.preorderItems.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                      <span>{p.menuItem?.name} × {p.quantity}</span>
                      <span className="text-muted">${(p.unitPrice * p.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4, fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>
                    {t('myBookings.total')}: ${b.preorderItems.reduce((s, p) => s + p.unitPrice * p.quantity, 0).toFixed(2)}
                  </div>
                </div>
              )}

              {(b.status === 'confirmed' || b.status === 'pending') && (
                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                  <X size={14} /> {t('myBookings.cancelBooking')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
