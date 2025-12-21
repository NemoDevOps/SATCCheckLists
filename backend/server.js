const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'Артём' }]);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
