import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { restaurantAPI } from '../api/index.js';
import { useLang } from '../context/LangContext.jsx';
import FloorPlanViewer from '../components/FloorPlan/FloorPlanViewer.jsx';
import BookingForm from '../components/Booking/BookingForm.jsx';
import MenuList from '../components/Menu/MenuList.jsx';
import { Star, MapPin, Clock, Phone } from 'lucide-react';

export default function RestaurantPage() {
  const { id } = useParams();
  const { t } = useLang();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeTab, setActiveTab] = useState('book');
  const [loading, setLoading] = useState(true);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkTime, setCheckTime] = useState('19:00');

  useEffect(() => {
    Promise.all([
      restaurantAPI.get(id),
      restaurantAPI.menu(id)
    ]).then(([resData, menuData]) => {
      setRestaurant(resData.data);
      setMenu(menuData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const checkAvailability = useCallback(() => {
    restaurantAPI.availability(id, checkDate, checkTime)
      .then(res => setAvailability(res.data))
      .catch(() => {});
  }, [id, checkDate, checkTime]);

  useEffect(() => {
    if (checkDate && checkTime) checkAvailability();
  }, [checkAvailability]);

  const handleTableSelect = (table) => {
    const dbTable = restaurant.tables?.find(t => t.tableRef === table.id);
    setSelectedTable({ ...table, dbId: dbTable?.id, seatCount: dbTable?.seatCount || table.seats });
  };

  const handleBookingSuccess = () => {
    setSelectedTable(null);
    checkAvailability();
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!restaurant) return <div className="container mt-3"><p className="text-muted">{t('restaurant.notFound')}</p></div>;

  const floorPlan = typeof restaurant.floorPlan === 'string' ? JSON.parse(restaurant.floorPlan) : restaurant.floorPlan;
  const containerWidth = 780;
  const scale = Math.min(1, containerWidth / (floorPlan.width || 800));

  const availCount = availability ? availability.filter(a => a.available).length : 0;
  const totalCount = availability ? availability.length : 0;

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Restaurant Header */}
      <div className="animate-fade-in" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {restaurant.imageUrl ? (
            <img src={restaurant.imageUrl} alt={restaurant.name} style={{ width: 100, height: 100, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--accent), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍽</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.75rem' }}>{restaurant.name}</h1>
              <div className="rating" style={{ fontSize: '1.1rem' }}>
                <Star size={18} fill="currentColor" />
                {restaurant.rating}/10
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {restaurant.address}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {restaurant.openingHours}</span>
              {restaurant.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={14} /> {restaurant.phone}</span>}
            </div>
            {restaurant.description && <p className="text-sm text-muted" style={{ marginTop: 8, maxWidth: 600 }}>{restaurant.description}</p>}
            <span className="badge badge-accent mt-1">{restaurant.cuisineType}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20, display: 'inline-flex' }}>
        <button className={`tab ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
          🪑 {t('restaurant.bookTab')}
        </button>
        <button className={`tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          📋 {t('restaurant.menuTab')}
        </button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          ℹ️ {t('restaurant.infoTab')}
        </button>
      </div>

      {/* Book Tab */}
      {activeTab === 'book' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: selectedTable ? '1fr 380px' : '1fr', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="input-group">
                <label>{t('restaurant.date')}</label>
                <input type="date" className="input" value={checkDate} onChange={e => setCheckDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="input-group">
                <label>{t('restaurant.time')}</label>
                <select className="input" value={checkTime} onChange={e => setCheckTime(e.target.value)}>
                  {Array.from({ length: 28 }, (_, i) => {
                    const h = Math.floor(i / 2) + 10;
                    const m = i % 2 === 0 ? '00' : '30';
                    if (h > 23) return null;
                    return <option key={i} value={`${h.toString().padStart(2, '0')}:${m}`}>{h}:{m}</option>;
                  }).filter(Boolean)}
                </select>
              </div>
              <p className="text-xs text-muted" style={{ paddingBottom: 10 }}>
                {availability
                  ? `${availCount} ${t('restaurant.of')} ${totalCount} ${t('restaurant.tablesAvail')}`
                  : t('restaurant.checkAvail')}
              </p>
            </div>

            <FloorPlanViewer
              floorPlan={floorPlan}
              availability={availability}
              selectedTable={selectedTable?.id}
              onSelectTable={handleTableSelect}
              scale={scale}
            />

            {!selectedTable && (
              <p className="text-muted text-sm mt-2" style={{ textAlign: 'center' }}>
                {t('restaurant.clickHint')}
              </p>
            )}
          </div>

          {selectedTable && (
            <div className="animate-slide-up">
              <BookingForm
                restaurant={restaurant}
                table={selectedTable}
                menu={menu}
                onClose={() => setSelectedTable(null)}
                onSuccess={handleBookingSuccess}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="animate-fade-in">
          <MenuList menu={menu} />
        </div>
      )}

      {activeTab === 'info' && (
        <div className="animate-fade-in" style={{ maxWidth: 600 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              [t('restaurant.address'), restaurant.address],
              [t('restaurant.openingHours'), restaurant.openingHours],
              restaurant.phone ? [t('restaurant.phone'), restaurant.phone] : null,
              [t('restaurant.cuisine'), restaurant.cuisineType],
              [t('restaurant.bookingDuration'), `${restaurant.defaultBookingDuration} ${t('restaurant.minutesPer')}`],
              [t('restaurant.tables'), `${restaurant.tables?.length} ${t('restaurant.tablesCount')}`],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
