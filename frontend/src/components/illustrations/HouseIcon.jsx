/** A single simple house icon, used for empty states and small accents. */
export default function HouseIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 30 L32 10 L56 30"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 26 V52 H50 V26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <rect x="27" y="34" width="10" height="18" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.12" />
      <rect x="19" y="32" width="8" height="8" stroke="currentColor" strokeWidth="2" />
      <rect x="37" y="32" width="8" height="8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
