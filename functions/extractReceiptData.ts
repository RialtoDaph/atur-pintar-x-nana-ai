import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const today = new Date().toISOString().split('T')[0];

    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `Kamu adalah OCR ahli untuk struk belanja. Ekstrak semua informasi dari gambar struk ini secara detail dan akurat.
      
      Yang harus diekstrak:
      - store_name: nama toko/merchant
      - date: tanggal transaksi format YYYY-MM-DD (jika tidak ada gunakan: ${today})
      - total_amount: total tagihan dalam angka (hanya angka, tanpa simbol mata uang)
      - tax_amount: total pajak/PPN dalam angka (jika tidak ada, gunakan 0)
      - items: daftar semua item yang dibeli, masing-masing dengan name, price (per unit), dan quantity
      
      Pastikan semua nilai angka adalah number, bukan string.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          store_name: { type: "string" },
          date: { type: "string" },
          total_amount: { type: "number" },
          tax_amount: { type: "number" },
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
        required: ["store_name", "date", "total_amount", "items"]
      }
    });

    return Response.json({
      status: "success",
      data: {
        store_name: extracted.store_name || "Toko",
        date: extracted.date || today,
        total_amount: extracted.total_amount || 0,
        tax_amount: extracted.tax_amount || 0,
        receipt_image_url: file_url,
        items: (extracted.items || []).map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          allocated_to: []
        }))
      }
    });

  } catch (error) {
    console.error('extractReceiptData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});