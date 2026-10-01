// Helpers from the old booking system. Nothing imports these any more.
export function formatLegacyDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function legacyStatus(s: string) {
  return s === 'canceled' ? 'cancelled' : s;
}
