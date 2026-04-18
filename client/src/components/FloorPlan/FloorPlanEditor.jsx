import { useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';
import { Plus, Save, Trash2, X } from 'lucide-react';

const COLORS = {
  wall: '#1a1a25',
  kitchen: '#2a2a3a',
  bar: '#2d2744',
  door: '#6c5ce7',
  floor: '#050508',
  text: '#ffffff',
  textDim: '#a0a0b8',
  table: '#222233',
  selected: '#ccff00' // Accent
};

export default function FloorPlanEditor({ initialFloorPlan, onSave }) {
  const [floorPlan, setFloorPlan] = useState(
    initialFloorPlan || { width: 800, height: 600, tables: [], decorations: [] }
  );
  const [selectedTableId, setSelectedTableId] = useState(null);
  
  // For editing table properties
  const [editForm, setEditForm] = useState(null);

  const { width = 800, height = 600, tables = [], decorations = [] } = floorPlan;

  const handleDragEnd = (e, tableId) => {
    const node = e.target;
    // Align to 25px grid to perfectly sync with the 50px grid lines
    const x = Math.round(node.x() / 25) * 25;
    const y = Math.round(node.y() / 25) * 25;
    
    setFloorPlan({
      ...floorPlan,
      tables: tables.map(t => t.id === tableId ? { ...t, x, y } : t)
    });
    
    // Reset konva position so React controls it
    node.position({ x, y });
  };

  const addTable = (shape) => {
    const newId = `T${Math.floor(Math.random() * 1000)}`;
    const newTable = {
      id: newId,
      label: newId,
      shape,
      seats: shape === 'circle' ? 2 : 4,
      x: Math.round((width / 2) / 25) * 25,
      y: Math.round((height / 2) / 25) * 25,
      ...(shape === 'circle' ? { radius: 25 } : { width: 100, height: 50 })
    };
    setFloorPlan({ ...floorPlan, tables: [...tables, newTable] });
    setSelectedTableId(newId);
    setEditForm(newTable);
  };

  const updateTable = (e) => {
    e.preventDefault();
    setFloorPlan({
      ...floorPlan,
      tables: tables.map(t => t.id === editForm.id ? editForm : t)
    });
  };

  const deleteTable = (id) => {
    setFloorPlan({
      ...floorPlan,
      tables: tables.filter(t => t.id !== id)
    });
    if (selectedTableId === id) {
      setSelectedTableId(null);
      setEditForm(null);
    }
  };

  return (
    <div className="admin-floor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20 }}>
      {/* Canvas Area */}
      <div style={{ background: COLORS.floor, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <Stage 
          width={width} 
          height={height} 
          onMouseDown={(e) => {
            // Deselect when clicking empty space
            if (e.target === e.target.getStage()) {
              setSelectedTableId(null);
              setEditForm(null);
            }
          }}
        >
          <Layer>
            <Rect x={0} y={0} width={width} height={height} fill={COLORS.floor} />

            {/* Grid lines */}
            {Array.from({ length: Math.ceil(width / 50) }).map((_, i) => (
              <Line key={`gv-${i}`} points={[i * 50, 0, i * 50, height]} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
            ))}
            {Array.from({ length: Math.ceil(height / 50) }).map((_, i) => (
              <Line key={`gh-${i}`} points={[0, i * 50, width, i * 50]} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
            ))}

            {decorations.map((d, i) => (
              <Rect key={`deco-${i}`} x={d.x} y={d.y} width={d.width} height={d.height} fill={COLORS.wall} opacity={0.5} />
            ))}

            {tables.map(table => {
              const isSelected = selectedTableId === table.id;
              
              if (table.shape === 'circle') {
                return (
                  <Group
                    key={table.id}
                    x={table.x}
                    y={table.y}
                    draggable
                    onDragEnd={(e) => handleDragEnd(e, table.id)}
                    onClick={() => { setSelectedTableId(table.id); setEditForm(table); }}
                  >
                    <Circle
                      x={0} y={0} radius={table.radius || 30}
                      fill={isSelected ? COLORS.selected : COLORS.table}
                      stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={isSelected ? 3 : 1}
                      shadowBlur={isSelected ? 15 : 5}
                      shadowColor={isSelected ? COLORS.selected : '#000'}
                    />
                    <Text
                      x={-(table.radius || 30)} y={-14}
                      width={(table.radius || 30) * 2} align="center"
                      text={table.label} fontSize={12} fontStyle="bold" fill={isSelected ? '#000' : '#fff'}
                    />
                    <Text
                      x={-(table.radius || 30)} y={2}
                      width={(table.radius || 30) * 2} align="center"
                      text={`${table.seats} seats`} fontSize={10} fill={isSelected ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.6)'}
                    />
                  </Group>
                );
              }

              // Rectangle
              const tw = table.width || 80;
              const th = table.height || 50;

              return (
                <Group
                  key={table.id}
                  x={table.x}
                  y={table.y}
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, table.id)}
                  onClick={() => { setSelectedTableId(table.id); setEditForm(table); }}
                >
                  <Rect
                    x={-tw / 2} y={-th / 2} width={tw} height={th}
                    fill={isSelected ? COLORS.selected : COLORS.table}
                    cornerRadius={6}
                    stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isSelected ? 3 : 1}
                    shadowBlur={isSelected ? 15 : 5}
                    shadowColor={isSelected ? COLORS.selected : '#000'}
                  />
                  <Text
                    x={-tw / 2} y={-th / 2 + th / 2 - 14}
                    width={tw} align="center"
                    text={table.label} fontSize={12} fontStyle="bold" fill={isSelected ? '#000' : '#fff'}
                  />
                  <Text
                    x={-tw / 2} y={-th / 2 + th / 2 + 2}
                    width={tw} align="center"
                    text={`${table.seats} seats`} fontSize={10} fill={isSelected ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.6)'}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* Tools / Inspector */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: height, overflowY: 'auto', overflowX: 'hidden' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Editor Tools</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary w-full" onClick={() => addTable('circle')} style={{ fontSize: 12 }}>
              <Plus size={14} /> Arc Table
            </button>
            <button className="btn btn-secondary w-full" onClick={() => addTable('rect')} style={{ fontSize: 12 }}>
              <Plus size={14} /> Rect Table
            </button>
          </div>
        </div>

        {editForm && (
          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: 'var(--accent)' }}>Edit Table {editForm.id}</h4>
              <button 
                type="button" 
                onClick={() => { setSelectedTableId(null); setEditForm(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={updateTable} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label>Label</label>
                <input className="input" value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Seats</label>
                <input type="number" min="1" className="input" value={editForm.seats} onChange={e => setEditForm({...editForm, seats: parseInt(e.target.value) || 2})} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 8 }}>Update</button>
                <button type="button" className="btn btn-danger" style={{ padding: 8 }} onClick={() => deleteTable(editForm.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-primary w-full" onClick={() => onSave(floorPlan)}>
            <Save size={16} /> Save Floor Plan
          </button>
        </div>
      </div>
    </div>
  );
}
