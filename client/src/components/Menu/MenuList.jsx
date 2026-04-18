import { Star } from 'lucide-react';

export default function MenuList({ menu }) {
  if (!menu || Object.keys(menu).length === 0) {
    return <p className="text-muted text-center mt-3">No menu items available</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {Object.entries(menu).map(([category, items]) => (
        <div key={category}>
          <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 4, height: 20, borderRadius: 2,
              background: 'linear-gradient(to bottom, var(--accent), #8b5cf6)',
              display: 'inline-block'
            }} />
            {category}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {items.map(item => (
              <div
                key={item.id}
                className="card"
                style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-glass)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0
                  }}>
                    {category === 'Drinks' ? '🍷' : category === 'Desserts' ? '🍰' : category === 'Starters' ? '🥗' : '🍽'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                    <span style={{
                      fontWeight: 700, color: 'var(--accent-light)', fontSize: '0.9rem',
                      whiteSpace: 'nowrap', marginLeft: 8
                    }}>
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted" style={{ marginTop: 3, lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
