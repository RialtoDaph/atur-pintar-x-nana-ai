/**
 * Format number as Indonesian Rupiah
 * e.g. 5000000 => "Rp 5.000.000"
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.abs(Math.round(amount)).toLocaleString('id-ID');
}