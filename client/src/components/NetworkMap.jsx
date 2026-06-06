import { useMemo } from 'react'

const LINE_COLORS = {
  'Red Line':    '#e74c3c',
  'Blue Line':   '#3498db',
  'Green Line':  '#2ecc71',
  'Yellow Line': '#f1c40f',
  'Purple Line': '#9b59b6',
  'Orange Line': '#e67e22',
}

const STATION_COORDS = {
  1:  { x: 80,  y: 110 },
  2:  { x: 210, y: 110 },
  3:  { x: 360, y: 110 },
  4:  { x: 510, y: 110 },
  5:  { x: 660, y: 110 },
  6:  { x: 830, y: 110 },
  7:  { x: 210, y: 240 },
  8:  { x: 210, y: 380 },
  9:  { x: 460, y: 320 },
  10: { x: 660, y: 260 },
  11: { x: 660, y: 400 },
  12: { x: 80,  y: 510 },
  13: { x: 210, y: 510 },
  14: { x: 380, y: 510 },
  15: { x: 530, y: 510 },
  16: { x: 680, y: 510 },
  17: { x: 830, y: 510 },
}

function NetworkMap({ network, showLines = true, highlightedRoute = [], startStationId = null, endStationId = null }) {
  // calcola gli interscambi: stazioni che appaiono in più di una linea
  const interchangeIds = useMemo(() => {
    if (!network) return new Set();
    const lineCount = {};
    for (const seg of network.segments) {
      if (!lineCount[seg.from_id]) lineCount[seg.from_id] = new Set();
      if (!lineCount[seg.to_id])   lineCount[seg.to_id]   = new Set();
      lineCount[seg.from_id].add(seg.line_id);
      lineCount[seg.to_id].add(seg.line_id);
    }
    return new Set(
      Object.entries(lineCount)
        .filter(([, lines]) => lines.size > 1)
        .map(([id]) => Number(id))
    );
  }, [network]);
  const segmentGroups = useMemo(() => {
  if (!network) return {};
  const groups = {};
  for (const seg of network.segments) {
    const key = [Math.min(seg.from_id, seg.to_id), Math.max(seg.from_id, seg.to_id)].join('-');
    if (!groups[key]) groups[key] = [];
    groups[key].push(seg);
  }
  return groups;
}, [network]);

  if (!network) return <p>Loading map...</p>;

  return (
    <svg
      viewBox="0 0 940 640"
      style={{ width: '100%', maxWidth: '900px', display: 'block', margin: '0 auto', background: '#1a1a2e', borderRadius: '12px' }}
    >
      {/* LINEE */}
      {showLines && Object.values(segmentGroups).map((group) =>
        group.map((seg, idx) => {
            const from = STATION_COORDS[seg.from_id];
            const to   = STATION_COORDS[seg.to_id];
            if (!from || !to) return null;

            // direzione canonica per il perpendicolare (sempre da id minore a id maggiore)
            const canonFrom = STATION_COORDS[Math.min(seg.from_id, seg.to_id)];
            const canonTo   = STATION_COORDS[Math.max(seg.from_id, seg.to_id)];
            const dx = canonTo.x - canonFrom.x;
            const dy = canonTo.y - canonFrom.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const px = -dy / len;
            const py =  dx / len;

            const offsetAmount = 7;
            const offset = (idx - (group.length - 1) / 2) * offsetAmount;

            return (
            <line
                key={`${seg.line_id}-${seg.from_id}-${seg.to_id}`}
                x1={from.x + px * offset} y1={from.y + py * offset}
                x2={to.x   + px * offset} y2={to.y   + py * offset}
                stroke={LINE_COLORS[seg.line_name] || '#fff'}
                strokeWidth={5}
                opacity={0.85}
            />
            );
        })
        )}

      {/* SEGMENTI DEL PERCORSO EVIDENZIATI */}
      {highlightedRoute.length > 1 && highlightedRoute.map((stationId, i) => {
        if (i === highlightedRoute.length - 1) return null;
        const from = STATION_COORDS[stationId];
        const to   = STATION_COORDS[highlightedRoute[i + 1]];
        if (!from || !to) return null;
        return (
          <line
            key={`route-${i}`}
            x1={from.x} y1={from.y}
            x2={to.x}   y2={to.y}
            stroke="#fff"
            strokeWidth={4}
            strokeDasharray="8,4"
            opacity={0.9}
          />
        );
      })}

      {/* STAZIONI */}
      {network.stations.map(station => {
        const coords = STATION_COORDS[station.id];
        if (!coords) return null;
        const isInterchange = interchangeIds.has(station.id);
        const isInRoute = highlightedRoute.includes(station.id);

        return (
          <g key={station.id}>
            {/* cerchio esterno per interscambi */}
            {isInterchange && (
              <circle
                cx={coords.x} cy={coords.y}
                r={16}
                fill="none"
                stroke="#fff"
                strokeWidth={2}
                opacity={0.5}
              />
            )}
            {/* cerchio principale */}
            <circle
              cx={coords.x} cy={coords.y}
              r={10}
              fill={isInRoute ? '#ffd700' : '#1a1a2e'}
              stroke={isInRoute ? '#ffd700' : '#fff'}
              strokeWidth={isInRoute ? 3 : 2}
            />
            <circle
              cx={coords.x} cy={coords.y}
              r={10}
              fill={
                station.id === startStationId ? '#e67e22' :
                station.id === endStationId   ? '#2ecc71' :
                isInRoute                     ? '#ffd700' :
                '#1a1a2e'
              }
              stroke={
                station.id === startStationId ? '#e67e22' :
                station.id === endStationId   ? '#2ecc71' :
                isInRoute                     ? '#ffd700' :
                '#fff'
              }
              strokeWidth={isInRoute || station.id === startStationId || station.id === endStationId ? 3 : 2}
            />
            {/* nome stazione */}
            <text
              x={coords.x}
              y={coords.y - 16}
              textAnchor="middle"
              fontSize={10}
              fill="#ddd"
              fontFamily="Arial, sans-serif"
            >
              {station.name}
            </text>
          </g>
        );
      })}

      {/* LEGENDA LINEE */}
      {showLines && (
        <g>
          {network.lines.map((line, i) => (
            <g key={line.id} transform={`translate(${20 + i * 145}, 590)`}>
              <rect width={12} height={12} rx={3} fill={LINE_COLORS[line.name] || '#fff'} />
              <text x={16} y={11} fontSize={10} fill="#bbb" fontFamily="Arial, sans-serif">
                {line.name}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export default NetworkMap;