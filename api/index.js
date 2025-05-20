// api/index.js
module.exports = (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Webhook forwarder is running. Send POST requests to /api/webhook'
  });
};