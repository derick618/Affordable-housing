const GOOD = new Set(['approved', 'confirmed', 'occupied', 'available', 'completed']);
const BAD = new Set(['rejected', 'declined', 'cancelled', 'maintenance']);

export function statusBadgeClass(status) {
  if (GOOD.has(status)) return 'badge badge-good';
  if (BAD.has(status)) return 'badge badge-bad';
  return 'badge badge-pending';
}
