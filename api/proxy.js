// api/proxy.js
/**
 * Proxy solusi untuk vercel karena vercel tidak mengizinkan koneksi langsung ke IP privat 
 * dan mungkin memblokir beberapa koneksi ke IP publik tertentu
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

// Opsi: gunakan layanan proxy eksternal untuk mengatasi batasan Vercel
// Contoh berikut menggunakan service seperti ngrok, serveo, atau localtunnel
// yang Anda punya kontrol atau akses

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'proxy_ready',
      message: 'Proxy endpoint aktif. Gunakan POST untuk forwarding.'
    });
  }
  
  // Simpan data request untuk ditampilkan
  const requestData = {
    headers: req.headers,
    body: req.body,
    method: req.method,
    url: req.url
  };
  
  try {
    // Ekstrak webhook ID jika ada (bisa digunakan untuk logging)
    const webhookId = req.query.id || 'unknown';
    console.log(`Processing webhook ID: ${webhookId}`, JSON.stringify(requestData));
    
    // Kirim response OK segera untuk mencegah timeout
    res.status(200).json({
      success: true,
      message: 'Webhook diterima dan diproses secara asynchronous',
      request_id: webhookId,
      timestamp: new Date().toISOString()
    });
    
    // Proses webhook secara asynchronous
    processWebhookAsync(requestData)
      .then(result => {
        console.log(`Webhook ${webhookId} processed successfully`, result);
      })
      .catch(error => {
        console.error(`Error processing webhook ${webhookId}:`, error.message);
      });
  } catch (error) {
    console.error('Error in proxy handler:', error);
    res.status(200).json({
      success: false,
      message: 'Webhook diterima tapi terjadi error',
      error: error.message
    });
  }
};

async function processWebhookAsync(requestData) {
  // Di sini kita akan implement solusi untuk mengatasi batasan Vercel
  // Contoh solusi:
  // 1. Gunakan queue service (misalnya SQS, RabbitMQ, dll)
  // 2. Kirim ke serverless function di platform lain (AWS Lambda, GCP Function)
  // 3. Gunakan database untuk menyimpan webhook & proses kemudian
  
  // Contoh implementasi sederhana dengan fetch
  const fetch = require('node-fetch');
  
  try {
    // Buat payload untuk dikirim ke service eksternal
    const payload = {
      targetIp: '160.187.210.22',
      targetPort: 2020,
      data: requestData.body,
      headers: {
        'Content-Type': requestData.headers['content-type'] || 'application/json',
        'User-Agent': requestData.headers['user-agent'] || '',
        'X-Webhook-Forwarded': 'true',
        'X-Original-Host': requestData.headers.host
      }
    };
    
    // Contoh: gunakan service proxy eksternal untuk mengatasi batasan
    // CATATAN: Anda perlu mengganti URL ini dengan layanan proxy yang sebenarnya
    // yang dapat meneruskan permintaan ke IP target Anda
    const proxyServiceUrl = 'http://160.187.210.22:2020'; 
    
    console.log('Sending to proxy service:', proxyServiceUrl);
    console.log('Payload:', JSON.stringify(payload));
    
    const proxyResponse = await fetch(proxyServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.PROXY_SERVICE_KEY // opsional
        },
      body: JSON.stringify(payload),
      timeout: 5000
    });

return await proxyResponse.json();

    
    // return await proxyResponse.json();
    
    // Sebagai gantinya, kita hanya log data untuk troubleshooting
    return {
      status: 'would_forward',
      message: 'In production, this would be forwarded through a proxy service',
      payload
    };
  } catch (error) {
    console.error('Error forwarding to proxy:', error);
    throw error;
  }
}