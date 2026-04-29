import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { restaurantAPI } from '../api/index.js';
import { useLang } from '../context/LangContext.jsx';
import { getTranslatedField } from '../utils/translate.js';
import { Star, MapPin, Clock, ChevronRight, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (rating) => {
  const color = rating >= 8.5 ? '#00d68f' : rating >= 7 ? '#ffaa00' : '#ff5c5c';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.4);border:2px solid white;"><span style="transform:rotate(45deg);font-size:11px;font-weight:700;color:white;">${rating}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

function FlyToRestaurant({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { duration: 1 });
  }, [coords, map]);
  return null;
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [flyTo, setFlyTo] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    restaurantAPI.list().then(res => {
      setRestaurants(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(r => {
    const tName = getTranslatedField(r.name, lang);
    const cuisine = r.cuisineType || '';
    return tName.toLowerCase().includes(search.toLowerCase()) ||
           cuisine.toLowerCase().includes(search.toLowerCase());
  });

  const center = restaurants.length > 0
    ? [restaurants.reduce((s, r) => s + r.lat, 0) / restaurants.length,
       restaurants.reduce((s, r) => s + r.lng, 0) / restaurants.length]
    : [41.9028, 12.4964];

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1>{t('home.title')}</h1>
        <p className="text-muted">{t('home.subtitle')}</p>
      </div>

      <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, height: 'calc(100vh - 160px)' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input w-full"
              style={{ paddingLeft: 38 }}
              placeholder={t('home.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="restaurant-search"
            />
          </div>

          {/* Restaurant List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
            {loading ? (
              <div className="loading-page"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-muted text-center mt-3">{t('home.noResults')}</p>
            ) : filtered.map(r => (
              <div
                key={r.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: 16,
                  borderColor: hoveredId === r.id ? 'var(--accent)' : undefined,
                  boxShadow: hoveredId === r.id ? 'var(--shadow-accent)' : undefined,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={() => { setHoveredId(r.id); setFlyTo([r.lat, r.lng]); }}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(`/restaurant/${r.id}`)}
                id={`restaurant-card-${r.id}`}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍽</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <h3 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getTranslatedField(r.name, lang)}
                      </h3>
                      <div className="rating">
                        <Star size={13} fill="currentColor" />
                        <span style={{ fontSize: '0.85rem' }}>{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {r.address}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <span className="badge badge-accent">{r.cuisineType}</span>
                      <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} /> {r.openingHours}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="home-map-container" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              maxZoom={20}
            />
            {filtered.map(r => (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={createIcon(r.rating)}
                eventHandlers={{
                  click: () => navigate(`/restaurant/${r.id}`),
                  mouseover: () => setHoveredId(r.id),
                  mouseout: () => setHoveredId(null)
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Outfit, sans-serif', textAlign: 'center' }}>
                    <strong style={{ fontSize: 14 }}>{getTranslatedField(r.name, lang)}</strong><br />
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>⭐ {r.rating}/10</span><br />
                    <span style={{ fontSize: 12, color: '#666' }}>{r.cuisineType}</span><br />
                    <button
                      onClick={() => navigate(`/restaurant/${r.id}`)}
                      style={{ marginTop: 6, padding: '4px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      {t('home.reserve')} <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            <FlyToRestaurant coords={flyTo} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
