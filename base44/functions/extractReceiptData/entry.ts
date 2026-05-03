import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const today = new Date().toISOString().split('T')[0];

    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `Kamu adalah sistem OCR ahli untuk struk belanja Indonesia. Analisis gambar struk ini dengan sangat teliti dan ekstrak semua informasi secara akurat.

PENTING - Panduan format angka Indonesia:
- Titik (.) digunakan sebagai pemisah ribuan: contoh 15.000 = 15000
- Koma (,) digunakan sebagai desimal: contoh 15.000,50 = 15000.50
- Simbol Rp, IDR, atau tanpa simbol = Rupiah Indonesia
- Konversikan semua angka ke format number JavaScript (tanpa titik pemisah ribuan)

Yang harus diekstrak:
1. store_name: Nama toko/merchant/restoran (cari di bagian atas struk)
2. date: Tanggal transaksi format YYYY-MM-DD. Cari format: DD/MM/YYYY, DD-MM-YYYY, atau tanggal tertulis. Jika tidak ada gunakan: ${today}
3. total_amount: Jumlah TOTAL yang dibayar (cari kata: TOTAL, GRAND TOTAL, JUMLAH, BAYAR). WAJIB berupa number, bukan 0 kecuali memang 0.
4. tax_amount: Pajak/PPN (cari: PPN, TAX, PAJAK). Jika tidak ada gunakan 0.
5. items: Semua item yang dibeli dengan name (nama item), price (harga per unit dalam Rupiah), quantity (jumlah)
6. category: Kategori pengeluaran berdasarkan nama toko dan item. Pilih SATU dari: food, transport, shopping, health, entertainment, education, utilities, other. Contoh: restoran/warung/kafe → food, grab/gojek/parkir → transport, alfamart/indomaret/mall → shopping, apotek/klinik/rumah sakit → health, bioskop/game → entertainment, listrik/air/internet → utilities.

Jika struk tidak terbaca dengan jelas, tetap coba ekstrak sebanyak mungkin informasi yang terlihat.
Pastikan total_amount TIDAK PERNAH 0 kecuali struk benar-benar menunjukkan 0.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          store_name: { type: "string" },
          date: { type: "string" },
          total_amount: { type: "number" },
          tax_amount: { type: "number" },
          category: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                quantity: { type: "number" }
              },
              required: ["name", "price", "quantity"]
            }
          }
        },
        required: ["store_name", "date", "total_amount", "category", "items"]
      }
    });

    // Fallback: hitung total dari items jika total_amount = 0 atau tidak ada
    const items = (extracted.items || []).map(item => ({
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      allocated_to: []
    }));

    let total = Number(extracted.total_amount) || 0;
    if (total === 0 && items.length > 0) {
      total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    const tax = Number(extracted.tax_amount) || 0;
    // Jika total belum termasuk pajak, tambahkan
    const finalTotal = total > 0 ? total : 0;

    const validCategories = ["food", "transport", "shopping", "health", "entertainment", "education", "utilities", "other"];
    const category = validCategories.includes(extracted.category) ? extracted.category : "other";

    return Response.json({
      status: "success",
      data: {
        store_name: extracted.store_name || "Toko",
        date: extracted.date || today,
        total_amount: finalTotal,
        tax_amount: tax,
        category,
        receipt_image_url: file_url,
        items
      }
    });

  } catch (error) {
    console.error('extractReceiptData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});