
const express = require('express');
const app = express();
const PORT = 5000;

// لتخزين الرسائل
let messages = [];

// زيادة حد حجم الطلب إلى 50MB للسماح بإرسال الصور
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// نقطة نهاية للحصول على الرسائل
app.get('/messages', (req, res) => {
  res.json(messages);
});

// نقطة نهاية لإرسال رسالة جديدة
app.post('/messages', (req, res) => {
  const { user, text, type } = req.body;
  const message = { user, text, type: type || 'text', timestamp: Date.now() };
  messages.push(message);
  res.json(message);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
