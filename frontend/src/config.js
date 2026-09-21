/**
 * Shows "demonstration data" notices in the footer and contact dialog. Turn it off
 * (VITE_DEMO_MODE=false) once the marketplace serves real listings. Listings that the API
 * itself flags as demo (`is_demo`) always get the notice regardless of this setting.
 */
export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE ?? 'true').trim().toLowerCase() !== 'false';
