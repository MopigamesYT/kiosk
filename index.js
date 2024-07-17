const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync('public/upload')) {
  fs.mkdirSync('public/upload');
}

app.use(express.json());
app.use(express.static('public'));
app.use('/upload', express.static('public/upload'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/upload/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

function readKioskData() {
  const filePath = path.join(__dirname, 'kiosk.json');
  if (!fs.existsSync(filePath)) {
    const initialData = {
      globalSettings: { theme: "default" },
      slides: []
    };
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeKioskData(data) {
  const filePath = path.join(__dirname, 'kiosk.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function reorganizeIds(data) {
  return data.map((item, index) => ({ ...item, id: index + 1 }));
}

app.get('/kiosk', (req, res) => {
  const kioskData = readKioskData();
  res.json(kioskData.slides);
});

app.get('/global-settings', (req, res) => {
  const kioskData = readKioskData();
  res.json(kioskData.globalSettings);
});

app.post('/global-settings', (req, res) => {
  const kioskData = readKioskData();
  kioskData.globalSettings = { ...kioskData.globalSettings, ...req.body };
  writeKioskData(kioskData);
  res.json({ success: true, globalSettings: kioskData.globalSettings });
});

app.post('/kiosk', (req, res) => {
  const kioskData = readKioskData();
  const newItem = { id: kioskData.slides.length + 1, ...req.body };
  kioskData.slides.push(newItem);
  writeKioskData(kioskData);
  res.json({ success: true, updatedData: kioskData.slides });
});

app.put('/kiosk/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const kioskData = readKioskData();
  const index = kioskData.slides.findIndex(item => item.id === id);

  if (index !== -1) {
    kioskData.slides[index] = { ...kioskData.slides[index], ...req.body };
    writeKioskData(kioskData);
    res.json({ success: true, updatedEntry: kioskData.slides[index] });
  } else {
    res.status(404).json({ success: false, message: 'Entry not found' });
  }
});

app.get('/kiosk.json', (req, res) => {
  const kioskData = readKioskData();
  res.json(kioskData);
});


app.delete('/kiosk/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const kioskData = readKioskData();
  const itemIndex = kioskData.slides.findIndex(item => item.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  kioskData.slides.splice(itemIndex, 1);
  kioskData.slides = reorganizeIds(kioskData.slides);
  writeKioskData(kioskData);

  res.json({ success: true, updatedData: kioskData.slides });
});

app.post('/kiosk/reorder', (req, res) => {
  const newOrder = req.body;
  const kioskData = readKioskData();

  if (!Array.isArray(newOrder)) {
    return res.status(400).json({ success: false, message: 'Invalid order format' });
  }

  const orderedSlides = newOrder.map(id => kioskData.slides.find(item => item.id === id)).filter(Boolean);
  if (orderedSlides.length !== newOrder.length) {
    return res.status(400).json({ success: false, message: 'Some items were not found' });
  }

  kioskData.slides = reorganizeIds(orderedSlides);
  writeKioskData(kioskData);
  res.json({ success: true, updatedData: kioskData.slides });
});

app.post('/kiosk/:id/toggle-visibility', (req, res) => {
  const id = parseInt(req.params.id);
  const kioskData = readKioskData();
  const itemIndex = kioskData.slides.findIndex(item => item.id === id);

  if (itemIndex !== -1) {
    kioskData.slides[itemIndex].visibility = !kioskData.slides[itemIndex].visibility;
    writeKioskData(kioskData);
    res.json({ success: true, updatedData: kioskData.slides });
  } else {
    res.status(404).json({ success: false, message: 'Item not found' });
  }
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ success: true, imagePath: `/upload/${req.file.filename}` });
  } else {
    res.status(400).json({ success: false, message: 'No file uploaded' });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
