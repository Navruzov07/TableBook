import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, restaurantAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import FloorPlanViewer from '../components/FloorPlan/FloorPlanViewer.jsx';
import FloorPlanEditor from '../components/FloorPlan/FloorPlanEditor.jsx';
import { Plus, Trash2, Save, Edit3, Calendar, Users, Check, X, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [restaurant, setRestaurant] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);

  // Menu form state
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', category: 'Mains', imageUrl: '' });
  const [editingMenuItem, setEditingMenuItem] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, isAdmin]);

  const loadData = async () => {
    try {
      if (user.restaurantId) {
        const [resData, menuData, bookData] = await Promise.all([
          restaurantAPI.get(user.restaurantId),
          restaurantAPI.menu(user.restaurantId),
          adminAPI.getBookings({})
        ]);
        setRestaurant(resData.data);
        setMenu(menuData.data);
        setBookings(bookData.data);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  // --- Booking Management ---
  const updateBookingStatus = async (id, status) => {
    try {
      await adminAPI.updateBookingStatus(id, status);
      toast.success(`Booking ${status}`);
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    } catch {
      toast.error('Failed to update');
    }
  };

  // --- Floor Plan Management ---
  const handleSaveFloorPlan = async (newPlan) => {
    try {
      setLoading(true);
      await adminAPI.updateFloorPlan(newPlan);
      toast.success('Floor plan saved successfully!');
      setRestaurant({ ...restaurant, floorPlan: JSON.stringify(newPlan) });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error('Failed to save floor plan');
    }
  };

  // --- Menu Management ---
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      if (editingMenuItem) {
        await adminAPI.updateMenuItem(editingMenuItem, menuForm);
        toast.success('Menu item updated');
      } else {
        await adminAPI.addMenuItem(menuForm);
        toast.success('Menu item added');
      }
      setMenuForm({ name: '', description: '', price: '', category: 'Mains', imageUrl: '' });
      setEditingMenuItem(null);
      // Reload menu
      const menuData = await restaurantAPI.menu(user.restaurantId);
      setMenu(menuData.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleEditMenuItem = (item) => {
    setEditingMenuItem(item.id);
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || ''
    });
    setActiveTab('menu');
  };

  const handleDeleteMenuItem = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await adminAPI.deleteMenuItem(id);
      toast.success('Deleted');
      const menuData = await restaurantAPI.menu(user.restaurantId);
      setMenu(menuData.data);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const statusBadge = (status) => {
    const map = { confirmed: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger', completed: 'badge-accent' };
    return <span className={`badge ${map[status] || 'badge-accent'}`}>{status}</span>;
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  if (!restaurant) {
    return (
      <div className="container mt-3 text-center">
        <h2>No Restaurant Linked</h2>
        <p className="text-muted mt-1">Your admin account is not linked to a restaurant yet.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Admin Panel</h1>
        <p className="text-muted text-sm">{restaurant.name}</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20, display: 'inline-flex' }}>
        <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          📅 Bookings ({bookings.length})
        </button>
        <button className={`tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          🍽 Menu
        </button>
        <button className={`tab ${activeTab === 'floorplan' ? 'active' : ''}`} onClick={() => setActiveTab('floorplan')}>
          🪑 Floor Plan
        </button>
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in">
          {bookings.length === 0 ? (
            <div className="card text-center" style={{ padding: 40 }}>
              <p style={{ fontSize: 36 }}>📋</p>
              <p className="text-muted mt-1">No bookings yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map(b => (
                <div key={b.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{b.user?.name}</span>
                      <span className="text-xs text-muted" style={{ marginLeft: 8 }}>{b.user?.email}</span>
                    </div>
                    {statusBadge(b.status)}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8, fontSize: '0.85rem' }}>
                    <span><Calendar size={13} style={{ verticalAlign: 'middle' }} /> {b.bookingDate}</span>
                    <span>🕐 {b.startTime} – {b.endTime}</span>
                    <span><Users size={13} style={{ verticalAlign: 'middle' }} /> {b.guestCount}</span>
                    <span className="text-muted">🪑 {b.table?.label}</span>
                  </div>
                  {b.preorderItems?.length > 0 && (
                    <p className="text-xs text-muted mb-1">
                      🍽 Pre-order: {b.preorderItems.map(p => `${p.menuItem?.name} ×${p.quantity}`).join(', ')}
                    </p>
                  )}
                  {(b.status === 'confirmed' || b.status === 'pending') && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(0,214,143,0.2)' }}
                        onClick={() => updateBookingStatus(b.id, 'completed')}>
                        <Check size={13} /> Complete
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => updateBookingStatus(b.id, 'cancelled')}>
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu Tab */}
      {activeTab === 'menu' && (
        <div className="animate-fade-in">
          {/* Add/Edit Form */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>
              {editingMenuItem ? '✏️ Edit Menu Item' : '➕ Add Menu Item'}
            </h3>
            <form onSubmit={handleAddMenuItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label>Name</label>
                <input className="input" placeholder="Dish name" value={menuForm.name}
                  onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Price ($)</label>
                <input className="input" type="number" step="0.01" placeholder="9.99" value={menuForm.price}
                  onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select className="input" value={menuForm.category}
                  onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}>
                  <option>Starters</option>
                  <option>Mains</option>
                  <option>Sides</option>
                  <option>Desserts</option>
                  <option>Drinks</option>
                </select>
              </div>
              <div className="input-group">
                <label>Image URL (optional)</label>
                <input className="input" placeholder="https://..." value={menuForm.imageUrl}
                  onChange={e => setMenuForm({ ...menuForm, imageUrl: e.target.value })} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <input className="input" placeholder="Short description" value={menuForm.description}
                  onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">
                  {editingMenuItem ? <><Save size={14} /> Update</> : <><Plus size={14} /> Add Item</>}
                </button>
                {editingMenuItem && (
                  <button className="btn btn-secondary" type="button" onClick={() => {
                    setEditingMenuItem(null);
                    setMenuForm({ name: '', description: '', price: '', category: 'Mains', imageUrl: '' });
                  }}>Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* Menu Items List */}
          {Object.entries(menu).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 10, color: 'var(--text-secondary)' }}>{category}</h3>
              {items.map(item => (
                <div key={item.id} className="card" style={{ padding: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                    <span className="text-sm text-muted" style={{ marginLeft: 8 }}>${item.price.toFixed(2)}</span>
                    {item.description && <p className="text-xs text-muted">{item.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEditMenuItem(item)}>
                      <Edit3 size={13} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMenuItem(item.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Floor Plan Tab */}
      {activeTab === 'floorplan' && (
        <div className="animate-fade-in">
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="text-sm text-muted">
              📐 Interactive Floor Plan Editor — drag tables to reposition, or use the panel to add/edit tables. Click Save when done.
            </p>
          </div>
          <FloorPlanEditor
            initialFloorPlan={typeof restaurant.floorPlan === 'string' ? JSON.parse(restaurant.floorPlan) : restaurant.floorPlan}
            onSave={handleSaveFloorPlan}
          />
        </div>
      )}
    </div>
  );
}
