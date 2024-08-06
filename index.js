const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync('public/upload')) {
  fs.mkdirSync('public/upload', { recursive: true });
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
  kioskData.globalSettings = { 
      ...kioskData.globalSettings, 
      ...req.body,
      watermarkSize: parseInt(req.body.watermarkSize) || 20 // Ensure it's a number
  };
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

app.post('/upload/:id', upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id);
  const kioskData = readKioskData();
  const itemIndex = kioskData.slides.findIndex(item => item.id === id);

  if (itemIndex !== -1) {
    if (req.file) {
      kioskData.slides[itemIndex].imagePath = `/upload/${req.file.filename}`;
      writeKioskData(kioskData);
      res.json({ success: true, updatedData: kioskData.slides[itemIndex] });
    } else {
      res.status(400).json({ success: false, message: 'No file uploaded' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Item not found' });
  }
});

app.post('/upload-watermark', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ success: true, imagePath: `/upload/${req.file.filename}` });
  } else {
    res.status(400).json({ success: false, message: 'No file uploaded' });
  }
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

const jsonUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/json') {
      return cb(new Error('Only JSON files are allowed'), false);
    }
    cb(null, true);
  }
});

// Add this new endpoint
app.post('/upload-kiosk-json', jsonUpload.single('kioskJson'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    // Parse the uploaded JSON
    const uploadedData = JSON.parse(req.file.buffer.toString());

    // Validate the structure of the uploaded JSON
    if (!uploadedData.hasOwnProperty('globalSettings') || !uploadedData.hasOwnProperty('slides')) {
      throw new Error('Invalid JSON structure');
    }

    // If we reach here, the JSON is valid. Write it to kiosk.json
    const filePath = path.join(__dirname, 'kiosk.json');
    fs.writeFileSync(filePath, JSON.stringify(uploadedData, null, 2));

    res.json({ success: true, message: 'kiosk.json has been updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid JSON file', error: error.message });
  }
});

app.get('/download-kiosk-json', (req, res) => {
  const kioskData = readKioskData();
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `kiosk-${date}_${time}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(kioskData, null, 2));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
