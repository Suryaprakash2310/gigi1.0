/**
 * Formats a booking reference, booking object, or ID into a clean display Booking ID (e.g., GGM-2610-0001).
 * Avoids mentioning raw MongoDB ObjectIds.
 */
export const formatBookingId = (id?: string | null | any): string => {
  if (!id) return '';
  if (typeof id === 'object') {
    return id.bookingCode || id.bookingReference || formatBookingId(id._id || id.id);
  }
  const str = String(id).trim();
  if (!str) return '';
  if (str.startsWith('GGM-')) return str;
  if (str.startsWith('#GGM-')) return str.slice(1);
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return `GGM-${str.slice(-6).toUpperCase()}`;
  }
  if (str.startsWith('#BK') || str.startsWith('#bk')) {
    return `GGM-${str.slice(3).toUpperCase()}`;
  }
  if (str.startsWith('BK') || str.startsWith('bk')) {
    return `GGM-${str.slice(2).toUpperCase()}`;
  }
  if (str.startsWith('#')) {
    return str.slice(1);
  }
  return str;
};
