import { useState } from 'react';
import { Calendar, Clock, Users, FileText, ShoppingBag, Plus, Minus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function BookingForm({ restaurant, table, menu, onClose, onSuccess }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    bookingDate: today,
    startTime: '19:00',
    guestCount: table?.seats || 2,
    notes: ''
  });
  const [preorder, setPreorder] = useState([]);
  const [showPreorder, setShowPreorder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const addPreorderItem = (item) => {
    const existing = preorder.find(p => p.menuItemId === item.id);
    if (existing) {
      setPreorder(preorder.map(p => p.menuItemId === item.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setPreorder([...preorder, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const updateQuantity = (menuItemId, delta) => {
    setPreorder(preorder.map(p => {
      if (p.menuItemId !== menuItemId) return p;
      const newQty = p.quantity + delta;
      return newQty > 0 ? { ...p, quantity: newQty } : p;
    }).filter(p => p.quantity > 0));
  };

  const removePreorderItem = (menuItemId) => {
    setPreorder(preorder.filter(p => p.menuItemId !== menuItemId));
  };

  const preorderTotal = preorder.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to book');
      navigate('/login');
      return;
    }
    if (!user?.isPhoneVerified) {
      toast.error('Phone verification is required to make a booking.');
      return;
    }
    if (!termsAccepted) {
      toast.error('You must agree to the Terms of Service to book.');
      return;
    }
    setLoading(true);
    try {
      await bookingAPI.create({
        restaurantId: restaurant.id,
        tableId: table.dbId,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        guestCount: parseInt(form.guestCount),
        notes: form.notes || null,
        preorder: preorder.map(p => ({
          menuItemId: p.menuItemId,
          quantity: p.quantity
        })),
        termsAccepted
      });
      toast.success('🎉 Booking confirmed!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-slide-up" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3>Reserve {table?.label}</h3>
          <p className="text-xs text-muted">{table?.seats} seats • {restaurant.name}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: 6 }}>
            <X size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group">
            <label><Calendar size={12} style={{ verticalAlign: 'middle' }} /> Date</label>
            <input type="date" className="input" value={form.bookingDate} onChange={update('bookingDate')} min={today} required />
          </div>
          <div className="input-group">
            <label><Clock size={12} style={{ verticalAlign: 'middle' }} /> Time</label>
            <select className="input" value={form.startTime} onChange={update('startTime')}>
              {Array.from({ length: 28 }, (_, i) => {
                const h = Math.floor(i / 2) + 10;
                const m = i % 2 === 0 ? '00' : '30';
                if (h > 23) return null;
                return <option key={i} value={`${h.toString().padStart(2, '0')}:${m}`}>{h}:{m}</option>;
              }).filter(Boolean)}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label><Users size={12} style={{ verticalAlign: 'middle' }} /> Guests</label>
          <select className="input" value={form.guestCount} onChange={update('guestCount')}>
            {Array.from({ length: table?.seats || 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'guest' : 'guests'}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label><FileText size={12} style={{ verticalAlign: 'middle' }} /> Special Requests</label>
          <textarea className="input" placeholder="Birthday, allergies, wheelchair..." value={form.notes} onChange={update('notes')} />
        </div>

        {/* Pre-order Section */}
        <div>
          {isAuthenticated && user?.trustScore < 50 ? (
            <div style={{ padding: 12, background: 'rgba(255, 60, 60, 0.1)', color: 'var(--danger)', borderRadius: 8, fontSize: '0.85rem' }}>
              ⚠️ Your trust score is too low ({user.trustScore}) to use pre-order functionality. Standard bookings only.
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => setShowPreorder(!showPreorder)}
              style={{ justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingBag size={14} />
                Pre-order Food {preorder.length > 0 && `(${preorder.length})`}
              </span>
              <span className="text-xs">{showPreorder ? 'Hide' : 'Show'} Menu</span>
            </button>
          )}

          {showPreorder && menu && isAuthenticated && user?.trustScore >= 50 && (
            <div style={{ marginTop: 10, maxHeight: 250, overflowY: 'auto', padding: 4 }}>
              {Object.entries(menu).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 12 }}>
                  <p className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
                    {category}
                  </p>
                  {items.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: '1px solid var(--border)'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-muted" style={{ marginLeft: 8 }}>${item.price.toFixed(2)}</span>
                      </div>
                      <button type="button" onClick={() => addPreorderItem(item)}
                        style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Pre-order summary */}
          {preorder.length > 0 && (
            <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <p className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 600 }}>YOUR PRE-ORDER</p>
              {preorder.map(p => (
                <div key={p.menuItemId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="text-sm" style={{ flex: 1 }}>{p.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button type="button" onClick={() => updateQuantity(p.menuItemId, -1)}
                      style={{ background: 'var(--border)', border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}>
                      <Minus size={12} />
                    </button>
                    <span className="text-sm" style={{ width: 20, textAlign: 'center' }}>{p.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(p.menuItemId, 1)}
                      style={{ background: 'var(--border)', border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}>
                      <Plus size={12} />
                    </button>
                    <span className="text-xs text-muted" style={{ width: 50, textAlign: 'right' }}>${(p.price * p.quantity).toFixed(2)}</span>
                    <button type="button" onClick={() => removePreorderItem(p.menuItemId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>Total</span>
                <span className="text-sm" style={{ fontWeight: 700, color: 'var(--accent-light)' }}>${preorderTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && !user?.isPhoneVerified && (
          <div style={{ padding: 12, background: 'rgba(255, 165, 0, 0.1)', color: '#cc8400', borderRadius: 8, fontSize: '0.85rem', textAlign: 'center' }}>
            <strong>Phone Verification Required</strong><br />
            You must verify your phone number in your profile before you can book.
          </div>
        )}

        {/* Legal Confirmation */}
        <div style={{ padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
            <input 
              type="checkbox" 
              checked={termsAccepted} 
              onChange={e => setTermsAccepted(e.target.checked)} 
              style={{ marginTop: 2, accentColor: 'var(--accent)' }}
              required 
            />
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              I agree to the TableBook Terms of Service, acknowledge the Cancellation Policy, and accept full responsibility for this reservation and any associated deposit or pre-order.
            </span>
          </label>
        </div>

        <button 
          className="btn btn-primary btn-lg w-full" 
          disabled={loading || !termsAccepted || (isAuthenticated && !user?.isPhoneVerified)} 
          type="submit"
        >
          {loading ? 'Booking...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  );
}
