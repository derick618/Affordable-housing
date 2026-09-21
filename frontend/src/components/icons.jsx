/**
 * Small inline icon set (stroke icons on a 24px grid, in the style of Lucide).
 * Every icon inherits `currentColor` and sizes via className, e.g. className="h-4 w-4".
 */
function Icon({ className = 'h-5 w-5', fill = 'none', children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);
export const MapPinIcon = (p) => (
  <Icon {...p}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>
);
export const BedIcon = (p) => (
  <Icon {...p}><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 17h20M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></Icon>
);
export const BathIcon = (p) => (
  <Icon {...p}><path d="M4 12h16a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a1 1 0 0 1 1-1ZM6 12V5a2 2 0 0 1 2-2h1M7 19l-1 2M17 19l1 2" /></Icon>
);
export const RulerIcon = (p) => (
  <Icon {...p}><path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4ZM7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2" /></Icon>
);
export const HeartIcon = ({ filled = false, ...p }) => (
  <Icon fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
  </Icon>
);
export const ShieldCheckIcon = (p) => (
  <Icon {...p}><path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.500 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.500-1.200 6.200-2.700a1.200 1.200 0 0 1 1.600 0C14.500 3.800 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" /></Icon>
);
export const PhoneIcon = (p) => (
  <Icon {...p}><path d="M22 16.900v3a2 2 0 0 1-2.200 2 19.800 19.800 0 0 1-8.600-3.100 19.500 19.500 0 0 1-6-6A19.800 19.800 0 0 1 2.100 4.200 2 2 0 0 1 4.100 2h3a2 2 0 0 1 2 1.700c.1 1 .4 1.900.7 2.800a2 2 0 0 1-.5 2.100L8.100 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.300 1.800.6 2.800.7a2 2 0 0 1 1.700 2Z" /></Icon>
);
export const MessageIcon = (p) => (
  <Icon {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></Icon>
);
export const FlagIcon = (p) => (
  <Icon {...p}><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></Icon>
);
export const MenuIcon = (p) => (
  <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
);
export const CloseIcon = (p) => (
  <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
);
export const ChevronLeftIcon = (p) => (
  <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>
);
export const ChevronRightIcon = (p) => (
  <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>
);
export const ChevronDownIcon = (p) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);
export const ArrowRightIcon = (p) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);
export const FilterIcon = (p) => (
  <Icon {...p}><path d="M3 6h18M6 12h12M10 18h4" /></Icon>
);
export const CheckIcon = (p) => (
  <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>
);
export const CalendarIcon = (p) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>
);
export const BuildingIcon = (p) => (
  <Icon {...p}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" /></Icon>
);
export const SofaIcon = (p) => (
  <Icon {...p}><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0ZM4 18v2M20 18v2" /></Icon>
);
export const ClockIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon>
);
export const AlertIcon = (p) => (
  <Icon {...p}><path d="M10.300 3.900 1.800 18a2 2 0 0 0 1.700 3h17a2 2 0 0 0 1.700-3L13.700 3.900a2 2 0 0 0-3.400 0ZM12 9v4M12 17h.01" /></Icon>
);
export const ShareIcon = (p) => (
  <Icon {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.600 13.500 6.800 4M15.400 6.500l-6.800 4" /></Icon>
);
export const WalletIcon = (p) => (
  <Icon {...p}><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5M16 13h.01" /></Icon>
);
export const UserIcon = (p) => (
  <Icon {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>
);
export const LogoutIcon = (p) => (
  <Icon {...p}><path d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></Icon>
);
export const ArrowLeftIcon = (p) => (
  <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>
);
export const CopyIcon = (p) => (
  <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>
);
export const InfoIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Icon>
);
export const BusIcon = (p) => (
  <Icon {...p}><path d="M8 6v6M16 6v6M2 12h20M6 4h12a3 3 0 0 1 3 3v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a3 3 0 0 1 3-3ZM7 18v2M17 18v2M7 15h.01M17 15h.01" /></Icon>
);
export const BookIcon = (p) => (
  <Icon {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></Icon>
);
export const StoreIcon = (p) => (
  <Icon {...p}><path d="m3 9 1.5-5h15L21 9M3 9v11h18V9M3 9c0 1.700 1.300 3 3 3s3-1.300 3-3c0 1.700 1.300 3 3 3s3-1.300 3-3c0 1.700 1.300 3 3 3s3-1.300 3-3M9 20v-5h6v5" /></Icon>
);
export const PlusCrossIcon = (p) => (
  <Icon {...p}><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" /></Icon>
);
export const DropletIcon = (p) => (
  <Icon {...p}><path d="M12 2.700s7 6.300 7 11.300a7 7 0 0 1-14 0c0-5 7-11.300 7-11.300Z" /></Icon>
);
export const ZapIcon = (p) => (
  <Icon {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9Z" /></Icon>
);
