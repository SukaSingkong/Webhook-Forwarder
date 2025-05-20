// api/store.js
/**
 * Solusi penyimpanan webhook - menyimpan webhook untuk diambil kemudian
 * Berguna jika target server tidak bisa diakses langsung dari Vercel
 */

// Simulasi penyimpanan menggunakan memory (dalam produksi gunakan database seperti MongoDB/Firestore)
const webhookStore = [];

module.exports = async (req, res) => {
  // Menampilkan webhooks yang disimpan
  if (req.method === 'GET') {
    const limit = parseInt(req.query.limit) || 10;
    
    return res.status(200).json({
      success: true,
      message: 'Webhook history',
      count: webhookStore.length,
      webhooks: webhookStore.slice(-limit).reverse() // Ambil webhook terbaru
    });
  }
  
  // Menyimpan webhook baru
  if (req.method === 'POST') {
    try {
      // Generate ID unik untuk webhook
      const webhookId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // Simpan webhook dengan metadata
      const webhook = {
        id: webhookId,
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: req.body,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      };
      
      // Simpan ke array (dalam produksi gunakan database)
      webhookStore.push(webhook);
      
      // Batasi ukuran penyimpanan (opsional)
      if (webhookStore.length > 100) {
        webhookStore.shift(); // Hapus webhook tertua jika lebih dari 100
      }
      
      console.log(`Webhook stored with ID: ${webhookId}`);
      
      // Kirim response
      return res.status(200).json({
        success: true,
        message: 'Webhook stored successfully',
        webhook_id: webhookId,
        retrieval_url: `${req.headers.host}/api/store?id=${webhookId}`
      });
    } catch (error) {
      console.error('Error storing webhook:', error);
      return res.status(200).json({
        success: false,
        message: 'Error storing webhook',
        error: error.message
      });
    }
  }
  
  // Method tidak diizinkan
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
};