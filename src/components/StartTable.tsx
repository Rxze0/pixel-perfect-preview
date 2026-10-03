// Isometric dining-table start screen: guest side (near) vs restaurant side (far).
const U = 22;
const CX = 200;
const CY = 120;
const iso = (x: number, y: number): [number, number] => [CX + (x - y) * U, CY + (x + y) * U * 0.5];
const pt = (x: number, y: number) => iso(x, y).join(",");
const DEPTH = 16;

// Table top diamond corners (grid 10 x 6)
const A = iso(0, 0);
const B = iso(10, 0);
const C = iso(10, 6);
const D = iso(0, 6);

export function StartTable({ onGuest, onRestaurant }: { onGuest: () => void; onRestaurant: () => void }) {
  const plate = iso(5, 4.9);
  const cloche = iso(4.2, 1.1);
  const bell = iso(7.4, 1.6);
  return (
    <div className="start-table">
      <svg viewBox="0 0 400 360" className="start-svg" aria-hidden="true">
        {/* table body */}
        <polygon points={`${A.join(",")} ${B.join(",")} ${B[0]},${B[1] + DEPTH} ${A[0]},${A[1] + DEPTH}`} fill="#15171E" />
        <polygon points={`${B.join(",")} ${C.join(",")} ${C[0]},${C[1] + DEPTH} ${B[0]},${B[1] + DEPTH}`} fill="#101218" />
        <polygon points={`${D.join(",")} ${C.join(",")} ${C[0]},${C[1] + DEPTH} ${D[0]},${D[1] + DEPTH}`} fill="#1A1D26" />
        <polygon points={`${pt(0, 0)} ${pt(10, 0)} ${pt(10, 6)} ${pt(0, 6)}`} fill="#23262F" stroke="#2C303D" strokeWidth="1.5" />
        {/* subtle wood grain */}
        {[1.5, 3, 4.5].map((y) => (
          <line key={y} x1={iso(0.4, y)[0]} y1={iso(0.4, y)[1]} x2={iso(9.6, y)[0]} y2={iso(9.6, y)[1]} stroke="#2A2E3A" strokeWidth="1" />
        ))}

        {/* restaurant side: cloche + bell */}
        <g className="side-rest">
          <ellipse cx={cloche[0]} cy={cloche[1] + 14} rx="46" ry="20" fill="#1B1E27" />
          <ellipse cx={cloche[0]} cy={cloche[1] + 12} rx="42" ry="17" fill="#8E97A8" />
          <path d={`M ${cloche[0] - 38} ${cloche[1] + 10} A 38 34 0 0 1 ${cloche[0] + 38} ${cloche[1] + 10} Z`} fill="#B9C2D0" />
          <path d={`M ${cloche[0] - 30} ${cloche[1] + 2} A 30 26 0 0 1 ${cloche[0] + 6} ${cloche[1] - 20}`} fill="none" stroke="#DDE3EC" strokeWidth="3" strokeLinecap="round" />
          <circle cx={cloche[0]} cy={cloche[1] - 26} r="5" fill="#DDE3EC" />
          <ellipse cx={bell[0]} cy={bell[1] + 8} rx="16" ry="7" fill="#1B1E27" />
          <path d={`M ${bell[0] - 13} ${bell[1] + 6} A 13 12 0 0 1 ${bell[0] + 13} ${bell[1] + 6} Z`} fill="#C7CFDC" />
          <circle cx={bell[0]} cy={bell[1] - 7} r="2.6" fill="#E8EDF4" />
        </g>

        {/* guest side: plate, fork, knife, glass */}
        <g className="side-guest">
          <ellipse cx={plate[0]} cy={plate[1] + 6} rx="34" ry="16" fill="#1B1E27" />
          <ellipse cx={plate[0]} cy={plate[1]} rx="32" ry="15" fill="#333949" />
          <ellipse cx={plate[0]} cy={plate[1]} rx="22" ry="10" fill="#282D3B" />
          {/* fork */}
          <g transform={`translate(${plate[0] - 52} ${plate[1] - 2}) rotate(-12)`}>
            <rect x="-2" y="-6" width="4" height="26" rx="2" fill="#9AA3B5" />
            <rect x="-5" y="-14" width="10" height="10" rx="3" fill="#9AA3B5" />
          </g>
          {/* knife */}
          <g transform={`translate(${plate[0] + 52} ${plate[1] - 2}) rotate(12)`}>
            <rect x="-2" y="-4" width="4" height="24" rx="2" fill="#9AA3B5" />
            <path d="M -3 -16 Q 4 -14 3 -2 L -3 -2 Z" fill="#B9C2D0" />
          </g>
          {/* glass */}
          <g transform={`translate(${plate[0] + 30} ${plate[1] - 34})`}>
            <ellipse cx="0" cy="16" rx="9" ry="4" fill="#1B1E27" />
            <path d="M -8 -12 L 8 -12 L 5 8 L -5 8 Z" fill="#46536E" opacity="0.85" />
            <ellipse cx="0" cy="-12" rx="8" ry="3.4" fill="#5A6A8C" />
          </g>
        </g>
      </svg>

      <button type="button" className="side-btn rest" onClick={onRestaurant} aria-label="I'm the restaurant — see your tables and guests">
        <b>I'm the restaurant</b>
        <span>See your tables and guests</span>
      </button>
      <button type="button" className="side-btn guest" onClick={onGuest} aria-label="I'm a guest — find your vibe and safe dishes">
        <b>I'm a guest</b>
        <span>Find your vibe and safe dishes</span>
      </button>
    </div>
  );
}
