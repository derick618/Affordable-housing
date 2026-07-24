/** A small row of houses used as a decorative hero illustration. */
export default function HouseRow({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="0" y1="170" x2="400" y2="170" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />

      {/* House 1 */}
      <g>
        <rect x="20" y="110" width="80" height="60" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.5" />
        <path d="M10 110 L60 70 L110 110" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.18" />
        <rect x="50" y="135" width="20" height="35" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.2" />
        <rect x="30" y="120" width="14" height="14" stroke="currentColor" strokeWidth="2" />
        <rect x="76" y="120" width="14" height="14" stroke="currentColor" strokeWidth="2" />
      </g>

      {/* House 2 (taller, center) */}
      <g>
        <rect x="150" y="80" width="100" height="90" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="2.5" />
        <path d="M140 80 L200 40 L260 80" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.22" />
        <rect x="185" y="120" width="26" height="50" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.25" />
        <rect x="163" y="95" width="16" height="16" stroke="currentColor" strokeWidth="2" />
        <rect x="221" y="95" width="16" height="16" stroke="currentColor" strokeWidth="2" />
        <rect x="163" y="120" width="16" height="16" stroke="currentColor" strokeWidth="2" />
        <rect x="221" y="120" width="16" height="16" stroke="currentColor" strokeWidth="2" />
      </g>

      {/* House 3 */}
      <g>
        <rect x="290" y="120" width="75" height="50" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.5" />
        <path d="M282 120 L327 85 L373 120" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.18" />
        <rect x="317" y="140" width="20" height="30" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.2" />
        <rect x="300" y="130" width="12" height="12" stroke="currentColor" strokeWidth="2" />
        <rect x="345" y="130" width="12" height="12" stroke="currentColor" strokeWidth="2" />
      </g>

      {/* Sun */}
      <circle cx="345" cy="35" r="14" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}
