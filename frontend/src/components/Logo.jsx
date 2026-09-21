import { Link } from 'react-router-dom';
import HouseIcon from './illustrations/HouseIcon';

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm dark:bg-brand-600 ${className}`}
    >
      <HouseIcon className="h-[62%] w-[62%]" />
    </span>
  );
}

/** Brand lockup. Pass `to={null}` to render it without a link. */
export default function Logo({ to = '/', light = false, className = '' }) {
  const content = (
    <>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className={`text-base font-extrabold tracking-tight ${light ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
          Affordable Housing
        </span>
        <span className={`text-[11px] font-medium ${light ? 'text-white/70' : 'text-stone-500 dark:text-stone-400'}`}>
          Nyumba bora, bei nafuu
        </span>
      </span>
    </>
  );
  const classes = `inline-flex items-center gap-2.5 ${className}`;
  return to ? (
    <Link to={to} className={classes} aria-label="Affordable Housing home">
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
