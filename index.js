const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

function readKioskData() {
  if (!fs.existsSync('kiosk.json')) {
    fs.writeFileSync('kiosk.json', JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync('kiosk.json', 'utf8'));
}

function writeKioskData(data) {
  fs.writeFileSync('kiosk.json', JSON.stringify(data, null, 2));
}

function reorganizeIds(data) {
  return data.map((item, index) => ({...item, id: index + 1}));
}

app.get('/kiosk.json', (req, res) => {
  // Ensure kiosk.json exists or is created before trying to serve it
  const kioskData = readKioskData(); // This will create kiosk.json if it doesn't exist
  res.json(kioskData);
});

app.get('/kiosk', (req, res) => {
  const kioskData = readKioskData();
  res.json(kioskData);
});

app.post('/kiosk', (req, res) => {
  const kioskData = readKioskData();
  const newEntry = {
    id: kioskData.length > 0 ? Math.max(...kioskData.map(item => item.id)) + 1 : 1,
    ...req.body
  };
  kioskData.push(newEntry);
  writeKioskData(kioskData);
  res.json({ success: true, newEntry });
});

app.put('/kiosk/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let kioskData = readKioskData();
  const index = kioskData.findIndex(item => item.id === id);
  if (index !== -1) {
    kioskData[index] = { ...kioskData[index], ...req.body };
    writeKioskData(kioskData);
    res.json({ success: true, updatedEntry: kioskData[index] });
  } else {
    res.status(404).json({ success: false, message: 'Entry not found' });
  }
});

app.delete('/kiosk/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let kioskData = readKioskData();
  kioskData = kioskData.filter(item => item.id !== id);
  kioskData = reorganizeIds(kioskData);
  writeKioskData(kioskData);
  res.json({ success: true, updatedData: kioskData });
});

app.post('/kiosk/reorder', (req, res) => {
  const newOrder = req.body;
  let kioskData = readKioskData();
  kioskData = newOrder.map(id => kioskData.find(item => item.id === id));
  kioskData = reorganizeIds(kioskData);
  writeKioskData(kioskData);
  res.json({ success: true, updatedData: kioskData });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});