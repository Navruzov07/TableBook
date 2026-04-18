import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';

const COLORS = {
  available: '#00d68f',
  availableHover: '#00f5a0',
  booked: '#ff5c5c',
  selected: '#ffaa00',
  wall: '#2a2a3a',
  kitchen: '#33334a',
  bar: '#2d2744',
  door: '#6c5ce7',
  floor: '#12121a',
  text: '#f0f0f5',
  textDim: '#666680'
};

export default function FloorPlanViewer({ floorPlan, availability, selectedTable, onSelectTable, scale = 1 }) {
  if (!floorPlan || !floorPlan.tables) return null;

  const { width = 800, height = 600, tables = [], decorations = [] } = floorPlan;

  const getTableStatus = (tableId) => {
    if (selectedTable === tableId) return 'selected';
    if (!availability) return 'available';
    const info = availability.find(a => a.tableRef === tableId);
    return info && !info.available ? 'booked' : 'available';
  };

  const getColor = (tableId) => COLORS[getTableStatus(tableId)];

  const handleTableClick = (table) => {
    const status = getTableStatus(table.id);
    if (status === 'booked') return;
    onSelectTable?.(table);
  };

  return (
    <div style={{ background: COLORS.floor, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <Stage width={width * scale} height={height * scale} scaleX={scale} scaleY={scale}>
        <Layer>
          {/* Floor background */}
          <Rect x={0} y={0} width={width} height={height} fill={COLORS.floor} />

          {/* Decorations */}
          {decorations.map((d, i) => {
            if (d.type === 'kitchen') {
              return (
                <Group key={`deco-${i}`}>
                  <Rect x={d.x} y={d.y} width={d.width} height={d.height}
                    fill={COLORS.kitchen} cornerRadius={4}
                    stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                  <Text x={d.x + d.width / 2 - 25} y={d.y + d.height / 2 - 8}
                    text="🍳 Kitchen" fontSize={13} fill={COLORS.textDim} />
                </Group>
              );
            }
            if (d.type === 'bar') {
              return (
                <Group key={`deco-${i}`}>
                  <Rect x={d.x} y={d.y} width={d.width} height={d.height}
                    fill={COLORS.bar} cornerRadius={4}
                    stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                  <Text x={d.x + d.width / 2 - 15} y={d.y + d.height / 2 - 8}
                    text="🍸 Bar" fontSize={13} fill={COLORS.textDim} />
                </Group>
              );
            }
            if (d.type === 'door') {
              return (
                <Group key={`deco-${i}`}>
                  <Rect x={d.x} y={d.y} width={d.width || 60} height={16}
                    fill={COLORS.door} cornerRadius={3} opacity={0.6} />
                  <Text x={d.x + (d.width || 60) / 2 - 12} y={d.y + 1}
                    text="🚪" fontSize={12} fill={COLORS.textDim} />
                </Group>
              );
            }
            return null;
          })}

          {/* Grid lines */}
          {Array.from({ length: Math.ceil(width / 100) }).map((_, i) => (
            <Line key={`gv-${i}`} points={[i * 100, 0, i * 100, height]}
              stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
          ))}
          {Array.from({ length: Math.ceil(height / 100) }).map((_, i) => (
            <Line key={`gh-${i}`} points={[0, i * 100, width, i * 100]}
              stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
          ))}

          {/* Tables */}
          {tables.map((table) => {
            const color = getColor(table.id);
            const status = getTableStatus(table.id);
            const isBooked = status === 'booked';

            if (table.shape === 'circle') {
              return (
                <Group
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  onTap={() => handleTableClick(table)}
                  style={{ cursor: isBooked ? 'not-allowed' : 'pointer' }}
                >
                  {/* Glow effect */}
                  {status === 'selected' && (
                    <Circle x={table.x} y={table.y} radius={table.radius + 8}
                      fill="rgba(255, 170, 0, 0.15)" />
                  )}
                  <Circle
                    x={table.x} y={table.y} radius={table.radius}
                    fill={color} opacity={isBooked ? 0.3 : 0.85}
                    stroke={status === 'selected' ? '#fff' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={status === 'selected' ? 2 : 1}
                    shadowBlur={status === 'selected' ? 15 : 5}
                    shadowColor={color}
                    shadowOpacity={0.5}
                  />
                  <Text
                    x={table.x - table.radius} y={table.y - 14}
                    width={table.radius * 2} align="center"
                    text={table.label} fontSize={11} fontStyle="bold" fill={isBooked ? COLORS.textDim : '#fff'}
                  />
                  <Text
                    x={table.x - table.radius} y={table.y + 2}
                    width={table.radius * 2} align="center"
                    text={`${table.seats} seats`} fontSize={9} fill={isBooked ? COLORS.textDim : 'rgba(255,255,255,0.7)'}
                  />
                </Group>
              );
            }

            // Rectangle table
            const rx = table.x - (table.width || 80) / 2;
            const ry = table.y - (table.height || 50) / 2;
            const tw = table.width || 80;
            const th = table.height || 50;

            return (
              <Group
                key={table.id}
                onClick={() => handleTableClick(table)}
                onTap={() => handleTableClick(table)}
              >
                {status === 'selected' && (
                  <Rect x={rx - 6} y={ry - 6} width={tw + 12} height={th + 12}
                    fill="rgba(255, 170, 0, 0.15)" cornerRadius={8} />
                )}
                <Rect
                  x={rx} y={ry} width={tw} height={th}
                  fill={color} opacity={isBooked ? 0.3 : 0.85}
                  cornerRadius={6}
                  stroke={status === 'selected' ? '#fff' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={status === 'selected' ? 2 : 1}
                  shadowBlur={status === 'selected' ? 15 : 5}
                  shadowColor={color}
                  shadowOpacity={0.5}
                />
                <Text
                  x={rx} y={ry + th / 2 - 14}
                  width={tw} align="center"
                  text={table.label} fontSize={11} fontStyle="bold" fill={isBooked ? COLORS.textDim : '#fff'}
                />
                <Text
                  x={rx} y={ry + th / 2 + 2}
                  width={tw} align="center"
                  text={`${table.seats} seats`} fontSize={9} fill={isBooked ? COLORS.textDim : 'rgba(255,255,255,0.7)'}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { color: COLORS.available, label: 'Available' },
          { color: COLORS.booked, label: 'Booked' },
          { color: COLORS.selected, label: 'Selected' }
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
