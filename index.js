const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const atomic = require('write-file-atomic');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure the upload directory exists
(async () => {
  try {
    await fs.mkdir('public/upload', { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
})();

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

// A simple promise queue to serialize writes to the kiosk.json file
let writeQueue = Promise.resolve();

async function readKioskData() {
  const filePath = path.join(__dirname, 'kiosk.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const initialData = {
        globalSettings: { theme: "default" },
        slides: []
      };
      await writeKioskData(initialData);
      return initialData;
    }
    throw error;
  }
}

function writeKioskData(data) {
  const filePath = path.join(__dirname, 'kiosk.json');
  const stringifiedData = JSON.stringify(data, null, 2);

  // Basic validation before writing
  try {
    JSON.parse(stringifiedData);
  } catch (e) {
    console.error("Error: Invalid JSON data before writing.", e);
    return Promise.reject(new Error("Invalid JSON data provided to writeKioskData"));
  }

  const writePromise = async () => {
    try {
      await atomic(filePath, stringifiedData);
    } catch (error) {
      console.error('Failed to write kiosk data atomically:', error);
      throw error;
    }
  };

  // Chain the new write operation to the queue
  writeQueue = writeQueue.then(writePromise, writePromise);
  return writeQueue;
}

function reorganizeIds(data) {
  return data.map((item, index) => ({ ...item, id: index + 1 }));
}

app.get('/kiosk', async (req, res) => {
  try {
    const kioskData = await readKioskData();
    res.json(kioskData.slides);
  } catch (error) {
    console.error('Error reading kiosk data for /kiosk:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve slides.' });
  }
});

app.get('/global-settings', async (req, res) => {
  try {
    const kioskData = await readKioskData();
    res.json(kioskData.globalSettings);
  } catch (error) {
    console.error('Error reading kiosk data for /global-settings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve global settings.' });
  }
});

app.post('/global-settings', async (req, res) => {
  try {
    const kioskData = await readKioskData();
    kioskData.globalSettings = { ...kioskData.globalSettings, ...req.body };
    await writeKioskData(kioskData);
    res.json({ success: true, globalSettings: kioskData.globalSettings });
  } catch (error) {
    console.error('Error in /global-settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update global settings.' });
  }
});

app.post('/kiosk', async (req, res) => {
  try {
    const kioskData = await readKioskData();
    const newItem = { id: kioskData.slides.length + 1, ...req.body };
    kioskData.slides.push(newItem);
    await writeKioskData(kioskData);
    res.json({ success: true, updatedData: kioskData.slides });
  } catch (error) {
    console.error('Error in /kiosk (POST):', error);
    res.status(500).json({ success: false, message: 'Failed to add new item.' });
  }
});

app.put('/kiosk/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const kioskData = await readKioskData();
    const index = kioskData.slides.findIndex(item => item.id === id);

    if (index !== -1) {
      kioskData.slides[index] = { ...kioskData.slides[index], ...req.body };
      await writeKioskData(kioskData);
      res.json({ success: true, updatedEntry: kioskData.slides[index] });
    } else {
      res.status(404).json({ success: false, message: 'Entry not found' });
    }
  } catch (error) {
    console.error('Error in /kiosk/:id (PUT):', error);
    res.status(500).json({ success: false, message: 'Failed to update item.' });
  }
});

app.get('/kiosk.json', async (req, res) => {
  try {
    const kioskData = await readKioskData();
    res.json(kioskData);
  } catch (error) {
    console.error('Error reading kiosk.json:', error);
    res.status(500).json({ success: false, message: 'Failed to read kiosk data.' });
  }
});

// Add this new endpoint to your server.js file

app.post('/import-config', async (req, res) => {
  try {
      const newConfig = req.body;
      
      // Validate the incoming configuration
      if (!newConfig || !newConfig.slides || !newConfig.globalSettings) {
          return res.status(400).json({
              success: false,
              message: 'Invalid configuration format'
          });
      }

      // Write the new configuration to file
      await writeKioskData(newConfig);

      res.json({
          success: true,
          message: 'Configuration imported successfully'
      });
  } catch (error) {
      console.error('Error importing configuration:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to import configuration'
      });
  }
});


app.delete('/kiosk/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const kioskData = await readKioskData();
    const itemIndex = kioskData.slides.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    kioskData.slides.splice(itemIndex, 1);
    kioskData.slides = reorganizeIds(kioskData.slides);
    await writeKioskData(kioskData);

    res.json({ success: true, updatedData: kioskData.slides });
  } catch (error) {
    console.error('Error in /kiosk/:id (DELETE):', error);
    res.status(500).json({ success: false, message: 'Failed to delete item.' });
  }
});

app.post('/kiosk/reorder', async (req, res) => {
  try {
    const newOrder = req.body;
    const kioskData = await readKioskData();

    if (!Array.isArray(newOrder)) {
      return res.status(400).json({ success: false, message: 'Invalid order format' });
    }

    const orderedSlides = newOrder.map(id => kioskData.slides.find(item => item.id === id)).filter(Boolean);
    if (orderedSlides.length !== newOrder.length) {
      return res.status(400).json({ success: false, message: 'Some items were not found' });
    }

    kioskData.slides = reorganizeIds(orderedSlides);
    await writeKioskData(kioskData);
    res.json({ success: true, updatedData: kioskData.slides });
  } catch (error) {
    console.error('Error in /kiosk/reorder:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder items.' });
  }
});

app.post('/kiosk/:id/toggle-visibility', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const kioskData = await readKioskData();
    const itemIndex = kioskData.slides.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
      kioskData.slides[itemIndex].visibility = !kioskData.slides[itemIndex].visibility;
      await writeKioskData(kioskData);
      res.json({ success: true, updatedData: kioskData.slides });
    } else {
      res.status(404).json({ success: false, message: 'Item not found' });
    }
  } catch (error) {
    console.error('Error in /kiosk/:id/toggle-visibility:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle visibility.' });
  }
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ success: true, imagePath: `/upload/${req.file.filename}` });
  } else {
    res.status(400).json({ success: false, message: 'No file uploaded' });
  }
});

// Set up watermark upload storage
const watermarkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
      const dir = 'public/watermarks';
      // This can remain sync as it's part of setup
      const fsSync = require('fs');
      if (!fsSync.existsSync(dir)) {
          fsSync.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
  },
  filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      cb(null, `watermark-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadWatermark = multer({ storage: watermarkStorage });

app.post('/upload-watermark', uploadWatermark.single('watermark'), (req, res) => {
  if (req.file) {
      res.json({ 
          success: true, 
          imagePath: `/watermarks/${req.file.filename}` 
      });
  } else {
      res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
      });
  }
});

// Add watermark static serving
app.use('/watermarks', express.static('public/watermarks'));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

