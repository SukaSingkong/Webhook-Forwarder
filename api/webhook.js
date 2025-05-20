// api/webhook.js
const axios = require('axios');

module.exports = async (req, res) => {
  // Mengizinkan GET request untuk pengujian
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ready',
      message: 'Webhook endpoint siap menerima POST request'
    });
  }
  
  // Memastikan hanya menerima metode POST untuk forwarding
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Mendapatkan semua headers dari request
    const headers = req.headers;
    
    // Mendapatkan body dari request
    const body = req.body;
    
    // Menggunakan variabel lingkungan jika tersedia, jika tidak gunakan default
    const targetUrl = process.env.TARGET_URL || 'http://160.187.210.22:2020';
    
    console.log('Forwarding webhook to:', targetUrl);
    console.log('Headers:', JSON.stringify(headers));
    console.log('Body:', JSON.stringify(body));

    // Tambahkan log untuk troubleshooting
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Content-Type:', headers['content-type']);

    // Coba tangkap error dengan lebih detail
    try {
      // Meneruskan request ke alamat target dengan timeout yang lebih lama
      const response = await axios({
        method: 'post',
        url: targetUrl,
        headers: {
          'Content-Type': headers['content-type'] || 'application/json',
          'X-Forwarded-From': req.headers.host || 'vercel-webhook-forwarder',
          // Salin header lain yang mungkin penting
          'User-Agent': headers['user-agent'] || '',
          'X-Signature': headers['x-signature'] || '',
          'X-Hub-Signature': headers['x-hub-signature'] || '',
          'X-GitHub-Event': headers['x-github-event'] || '',
        },
        data: body,
        timeout: 30000, // timeout 30 detik
        validateStatus: function (status) {
          // Menerima status apapun
          return true;
        }
      });
      
      console.log('Forward response status:', response.status);
      console.log('Forward response data:', JSON.stringify(response.data));
      
      // Mengembalikan respons dari target
      return res.status(200).json({
        success: true,
        message: 'Webhook forwarded successfully',
        target_response_status: response.status,
        target_response_data: response.data
      });
    } catch (axiosError) {
      // Log error axios dengan detail
      console.error('Axios error details:', {
        message: axiosError.message,
        code: axiosError.code,
        errno: axiosError.errno,
        syscall: axiosError.syscall,
        address: axiosError.address,
        port: axiosError.port,
        config: axiosError.config ? {
          url: axiosError.config.url,
          method: axiosError.config.method,
          headers: axiosError.config.headers,
          timeout: axiosError.config.timeout
        } : 'No config available'
      });
      
      throw axiosError; // re-throw untuk penanganan error di luar
    }
  } catch (error) {
    console.error('Error forwarding webhook:', error.message);
    
    // Mengembalikan error tetapi dengan status 200 agar webhook dianggap berhasil
    return res.status(200).json({
      success: false,
      message: 'Failed to forward webhook but acknowledged receipt',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};