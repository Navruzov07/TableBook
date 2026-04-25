import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ceoAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { getTranslatedField } from '../utils/translate.js';
import {
  Plus, Trash2, Edit3, UserCheck, UserX,
  Building2, CalendarDays, Users, X, Save, MapPin, Clock, Shield, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Small modal wrapper ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Restaurant form (create / edit) ───────────────────────────────────────────
const EMPTY_FORM = {
  name: { uz: '', ru: '', en: '' },
  description: { uz: '', ru: '', en: '' },
  address: '', lat: '', lng: '',
  cuisineType: '', openingHours: '', phone: '',
  imageUrl: '', defaultBookingDuration: 90, rating: 0
};

export default function CEOPage() {
  const { isCEO, isAuthenticated } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_FORM);

  // Assign admin modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRestaurantId, setAssignRestaurantId] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');

  // Deposit Rules modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [editingDepositId, setEditingDepositId] = useState(null);
  const [depositForm, setDepositForm] = useState({ requireDeposit: true, depositAmount: 5, freeCancelHours: 24 });

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isCEO) { navigate('/'); return; }
    loadAll();
  }, [isAuthenticated, isCEO]);

  const loadAll = async () => {
    try {
      const [rRes, uRes] = await Promise.all([
        ceoAPI.getRestaurants(),
        ceoAPI.getUsers()
      ]);
      setRestaurants(rRes.data);
      setUsers(uRes.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await ceoAPI.getBookings({});
      setBookings(res.data);
    } catch {
      toast.error(t('common.error'));
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings' && bookings.length === 0) loadBookings();
  }, [activeTab]);

  // ── Restaurant CRUD ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingRestaurant(null);
    setRestaurantForm(EMPTY_FORM);
    setShowRestaurantModal(true);
  };

  const openEdit = (r) => {
    setEditingRestaurant(r.id);
    const parseJSONField = (val, fallback) => {
      if (!val) return fallback;
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === 'object' ? parsed : fallback;
      } catch (e) {
        return { uz: val, ru: val, en: val };
      }
    };

    setEditingRestaurant(r.id);
    setRestaurantForm({
      name: parseJSONField(r.name, { uz: '', ru: '', en: '' }),
      description: parseJSONField(r.description, { uz: '', ru: '', en: '' }),
      address: r.address, lat: r.lat, lng: r.lng,
      cuisineType: r.cuisineType, openingHours: r.openingHours,
      phone: r.phone || '',
      imageUrl: r.imageUrl || '', defaultBookingDuration: r.defaultBookingDuration, rating: r.rating
    });
    setShowRestaurantModal(true);
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...restaurantForm,
        name: JSON.stringify(restaurantForm.name),
        description: JSON.stringify(restaurantForm.description)
      };

      if (editingRestaurant) {
        await ceoAPI.updateRestaurant(editingRestaurant, payload);
        toast.success(t('ceo.updated'));
      } else {
        await ceoAPI.createRestaurant(payload);
        toast.success(t('ceo.created'));
      }
      setShowRestaurantModal(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!confirm(t('ceo.deleteConfirm'))) return;
    try {
      await ceoAPI.deleteRestaurant(id);
      toast.success(t('ceo.deleted'));
      setRestaurants(r => r.filter(x => x.id !== id));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const openDepositRules = (r) => {
    setEditingDepositId(r.id);
    setDepositForm({ 
      requireDeposit: r.requireDeposit ?? true, 
      depositAmount: r.depositAmount ?? 5, 
      freeCancelHours: r.freeCancelHours ?? 24 
    });
    setShowDepositModal(true);
  };

  const handleSaveDepositRules = async (e) => {
    e.preventDefault();
    try {
      await ceoAPI.updateDepositRules(editingDepositId, depositForm);
      toast.success(t('ceo.depositRulesUpdated'));
      setShowDepositModal(false);
      loadAll();
    } catch {
      toast.error(t('common.error'));
    }
  };

  // ── Admin assignment ─────────────────────────────────────────────────────────
  const openAssign = (restaurantId) => {
    setAssignRestaurantId(restaurantId);
    setAssignUserId('');
    setShowAssignModal(true);
  };

  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    if (!assignUserId) return;
    try {
      await ceoAPI.assignAdmin(parseInt(assignUserId), assignRestaurantId);
      toast.success(t('ceo.adminAssigned'));
      setShowAssignModal(false);
      loadAll();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!confirm(t('ceo.removeAdminConfirm'))) return;
    try {
      await ceoAPI.removeAdmin(userId);
      toast.success(t('ceo.adminRemoved'));
      loadAll();
    } catch {
      toast.error(t('common.error'));
    }
  };

  // ── User management ──────────────────────────────────────────────────────────
  const handleToggleBan = async (user) => {
    const action = user.isBanned ? 'Unban' : 'Ban';
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    try {
      await ceoAPI.banUser(user.id, !user.isBanned);
      toast.success(action === 'Ban' ? t('ceo.userBanned') : t('ceo.userUnbanned'));
      loadAll();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateTrustScore = async (user, newScore) => {
    const parsed = parseInt(newScore);
    if (isNaN(parsed)) return;
    if (parsed === user.trustScore) return; // no change
    try {
      await ceoAPI.updateTrustScore(user.id, parsed);
      toast.success(t('ceo.trustScoreUpdated'));
      loadAll();
    } catch {
      toast.error(t('common.error'));
    }
  };

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = { confirmed: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger', completed: 'badge-accent' };
    return <span className={`badge ${map[status] || 'badge-accent'}`}>{status}</span>;
  };

  const roleBadge = (role) => {
    const map = { ceo: 'badge-danger', admin: 'badge-success', customer: 'badge-accent' };
    return <span className={`badge ${map[role] || 'badge-accent'}`}>{role}</span>;
  };

  // ── Filtered users (non-CEO) for assign dropdown ─────────────────────────────
  const eligibleUsers = users.filter(u => u.role !== 'ceo');

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.8rem' }}>👑</span>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>{t('ceo.title')}</h1>
          </div>
          <p className="text-muted text-sm">{t('ceo.subtitle')}</p>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { icon: <Building2 size={18} />, val: restaurants.length, label: t('ceo.restaurants') },
            { icon: <Users size={18} />, val: users.length, label: t('ceo.users') },
            { icon: <CalendarDays size={18} />, val: bookings.length || '—', label: t('ceo.allBookings') },
          ].map(({ icon, val, label }) => (
            <div key={label} className="card" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 110 }}>
              <span style={{ color: 'var(--accent)' }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>{val}</div>
                <div className="text-xs text-muted">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, display: 'inline-flex' }}>
        <button className={`tab ${activeTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveTab('restaurants')}>
          <Building2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('ceo.restaurants')}
        </button>
        <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          <CalendarDays size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('ceo.allBookings')}
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('ceo.users')}
        </button>
      </div>

      {/* ── RESTAURANTS TAB ── */}
      {activeTab === 'restaurants' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openCreate} id="ceo-add-restaurant-btn">
              <Plus size={16} /> {t('ceo.addRestaurant')}
            </button>
          </div>

          {restaurants.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <Building2 size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
              <p className="text-muted">{t('common.noData')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {restaurants.map(r => {
                const admin = r.admins?.[0];
                return (
                  <div key={r.id} className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
                            {getTranslatedField(r.name, lang)}
                          </h3>
                          <span className="badge badge-accent">{r.cuisineType}</span>
                        </div>
                        <p className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          <MapPin size={11} /> {r.address}
                        </p>
                        <p className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                          <Clock size={11} /> {r.openingHours}
                        </p>
                        <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span>🪑 {r._count?.tables ?? 0} {t('ceo.tables')}</span>
                          <span>📅 {r._count?.bookings ?? 0} {t('ceo.bookings')}</span>
                          {r.requireDeposit && <span>💳 Deposit: ${r.depositAmount}</span>}
                        </div>
                      </div>

                      {/* Admin section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                        {admin ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{admin.name}</div>
                              <div className="text-xs text-muted">{admin.email}</div>
                            </div>
                            <button
                              className="icon-btn"
                              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                              onClick={() => handleRemoveAdmin(admin.id)}
                              title={t('ceo.removeAdmin')}
                            >
                              <UserX size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openAssign(r.id)}
                          >
                            <UserCheck size={14} /> {t('ceo.assignAdmin')}
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openDepositRules(r)} title="Deposit Rules">
                          <Shield size={13} />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
                          <Edit3 size={13} /> {t('common.edit')}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRestaurant(r.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BOOKINGS TAB ── */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in">
          {bookings.length === 0 ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map(b => (
                <div key={b.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{b.user?.name}</span>
                      <span className="text-xs text-muted" style={{ marginLeft: 8 }}>{b.user?.email}</span>
                      <span className="badge badge-accent" style={{ marginLeft: 8 }}>{getTranslatedField(b.restaurant?.name, lang)}</span>
                    </div>
                    {statusBadge(b.status)}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>📅 {b.bookingDate}</span>
                    <span>🕐 {b.startTime} – {b.endTime}</span>
                    <span>👥 {b.guestCount}</span>
                    <span>🪑 {b.table?.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <div key={u.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, opacity: u.isBanned ? 0.6 : 1 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', textDecoration: u.isBanned ? 'line-through' : 'none' }}>{u.name}</span>
                  <span className="text-xs text-muted" style={{ marginLeft: 8 }}>{u.email}</span>
                  {u.isBanned && <span className="badge badge-danger" style={{ marginLeft: 8 }}>BANNED</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="text-xs text-muted">Trust Score:</span>
                    <input 
                      type="number" 
                      className="input" 
                      defaultValue={u.trustScore} 
                      onBlur={e => handleUpdateTrustScore(u, e.target.value)} 
                      style={{ width: 60, padding: '4px 8px', height: 28, fontSize: '0.85rem' }} 
                    />
                  </div>
                  {u.restaurantId && (
                    <span className="text-xs text-muted">
                      🏪 #{u.restaurantId}
                    </span>
                  )}
                  {roleBadge(u.role)}
                  {u.role === 'admin' && (
                    <button
                      className="icon-btn"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => handleRemoveAdmin(u.id)}
                      title={t('ceo.removeAdmin')}
                    >
                      <UserX size={14} />
                    </button>
                  )}
                  <button 
                    className={`btn ${u.isBanned ? 'btn-secondary' : 'btn-danger'} btn-sm`} 
                    onClick={() => handleToggleBan(u)}
                  >
                    <AlertTriangle size={14} /> {u.isBanned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESTAURANT MODAL ── */}
      {showRestaurantModal && (
        <Modal
          title={editingRestaurant ? t('ceo.editRestaurant') : t('ceo.addRestaurant')}
          onClose={() => setShowRestaurantModal(false)}
        >
          <form onSubmit={handleSaveRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('ceo.name')} (UZ) *</label>
                <input className="input" value={restaurantForm.name.uz} onChange={e => setRestaurantForm(f => ({ ...f, name: { ...f.name, uz: e.target.value } }))} required />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('ceo.name')} (RU) *</label>
                <input className="input" value={restaurantForm.name.ru} onChange={e => setRestaurantForm(f => ({ ...f, name: { ...f.name, ru: e.target.value } }))} required />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('ceo.name')} (EN) *</label>
                <input className="input" value={restaurantForm.name.en} onChange={e => setRestaurantForm(f => ({ ...f, name: { ...f.name, en: e.target.value } }))} required />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('ceo.address')} *</label>
                <input className="input" value={restaurantForm.address} onChange={e => setRestaurantForm(f => ({ ...f, address: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('ceo.lat')} *</label>
                <input className="input" type="number" step="any" value={restaurantForm.lat} onChange={e => setRestaurantForm(f => ({ ...f, lat: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('ceo.lng')} *</label>
                <input className="input" type="number" step="any" value={restaurantForm.lng} onChange={e => setRestaurantForm(f => ({ ...f, lng: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('ceo.cuisine')} *</label>
                <input className="input" value={restaurantForm.cuisineType} onChange={e => setRestaurantForm(f => ({ ...f, cuisineType: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('ceo.openingHours')} *</label>
                <input className="input" placeholder="09:00 – 22:00" value={restaurantForm.openingHours} onChange={e => setRestaurantForm(f => ({ ...f, openingHours: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>{t('ceo.phone')}</label>
                <input className="input" value={restaurantForm.phone} onChange={e => setRestaurantForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>{t('ceo.rating')}</label>
                <input className="input" type="number" step="0.1" min="0" max="10" value={restaurantForm.rating} onChange={e => setRestaurantForm(f => ({ ...f, rating: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>{t('ceo.duration')}</label>
                <input className="input" type="number" value={restaurantForm.defaultBookingDuration} onChange={e => setRestaurantForm(f => ({ ...f, defaultBookingDuration: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>{t('ceo.imageUrl')}</label>
                <input className="input" placeholder="https://..." value={restaurantForm.imageUrl} onChange={e => setRestaurantForm(f => ({ ...f, imageUrl: e.target.value }))} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('ceo.description')} (UZ)</label>
                <textarea className="input" value={restaurantForm.description.uz} onChange={e => setRestaurantForm(f => ({ ...f, description: { ...f.description, uz: e.target.value } }))} style={{ minHeight: 70 }} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('ceo.description')} (RU)</label>
                <textarea className="input" value={restaurantForm.description.ru} onChange={e => setRestaurantForm(f => ({ ...f, description: { ...f.description, ru: e.target.value } }))} style={{ minHeight: 70 }} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('ceo.description')} (EN)</label>
                <textarea className="input" value={restaurantForm.description.en} onChange={e => setRestaurantForm(f => ({ ...f, description: { ...f.description, en: e.target.value } }))} style={{ minHeight: 70 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRestaurantModal(false)}>{t('ceo.cancel')}</button>
              <button type="submit" className="btn btn-primary"><Save size={15} /> {t('ceo.save')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── ASSIGN ADMIN MODAL ── */}
      {showAssignModal && (
        <Modal title={t('ceo.assignAdmin')} onClose={() => setShowAssignModal(false)}>
          <form onSubmit={handleAssignAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>{t('ceo.selectUser')}</label>
              <select className="input" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required>
                <option value="">— {t('ceo.selectUser')} —</option>
                {eligibleUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>{t('ceo.cancel')}</button>
              <button type="submit" className="btn btn-primary"><UserCheck size={15} /> {t('ceo.assignAdmin')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── DEPOSIT RULES MODAL ── */}
      {showDepositModal && (
        <Modal title="Deposit Rules" onClose={() => setShowDepositModal(false)}>
          <form onSubmit={handleSaveDepositRules} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={depositForm.requireDeposit} 
                  onChange={e => setDepositForm(f => ({ ...f, requireDeposit: e.target.checked }))} 
                />
                Require Deposit for Bookings
              </label>
            </div>
            {depositForm.requireDeposit && (
              <>
                <div className="input-group">
                  <label>Deposit Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input" 
                    value={depositForm.depositAmount} 
                    onChange={e => setDepositForm(f => ({ ...f, depositAmount: e.target.value }))} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Free Cancellation Window (Hours)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={depositForm.freeCancelHours} 
                    onChange={e => setDepositForm(f => ({ ...f, freeCancelHours: e.target.value }))} 
                    required 
                  />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDepositModal(false)}>{t('ceo.cancel')}</button>
              <button type="submit" className="btn btn-primary"><Shield size={15} /> Save Rules</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
