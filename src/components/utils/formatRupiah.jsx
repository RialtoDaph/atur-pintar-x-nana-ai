/**
 * Format number as Indonesian Rupiah
 * e.g. 5000000 => "Rp 5.000.000"
 */
export function formatRupiah(amount) {
  return "Rp " + Math.round(amount || 0).toLocaleString("id-ID");
}