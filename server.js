/**
 * server.js
 */
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

/**
 * /api/listFiles
 * Returns a JSON list of file names in a given directory
 */
app.get('/api/listFiles', (req, res) => {
  const dirParam = req.query.dir || '';
  // If you want to decode in listFiles too, do so here:
  // let decodedDir = decodeURIComponent(dirParam);
  // decodedDir = decodedDir.replace(/\.\./g, '');
  // OR the original approach:
  const safeDir = dirParam.replace(/\.\./g, '');
  const fullPath = path.join(__dirname, safeDir);

  fs.readdir(fullPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: String(err) });
    }
    const fileList = files.filter(f => {
      const stat = fs.statSync(path.join(fullPath, f));
      return stat.isFile();
    });
    res.json({ files: fileList });
  });
});

/**
 * /api/saveConfig
 * Saves config data to a file on the server
 */
app.post('/api/saveConfig', (req, res) => {
  const { filePath, content } = req.body;
  if (!filePath || !content) {
    return res.status(400).json({ success: false, error: "Missing filePath or content." });
  }
  if (filePath.includes('..')) {
    return res.status(400).json({ success: false, error: "Invalid filePath." });
  }

  const fullPath = path.join(__dirname, filePath);
  fs.writeFile(fullPath, content, (err) => {
    if (err) {
      console.error("Failed to save file:", err);
      // Return success: false so the front end can display the error
      return res.status(500).json({ success: false, error: String(err) });
    }
    console.log("Saved file: " + fullPath);
    res.json({ success: true });
  });
});

/**
 * /api/getConfig
 * Returns the contents of a given config file (so editors can read them).
 */
app.get('/api/getConfig', (req, res) => {
  // Decode the query params so "config%2Fmaps" becomes "config/maps"
  let dirParam = req.query.dir || '';
  let fileParam = req.query.file || '';

  dirParam = decodeURIComponent(dirParam);
  fileParam = decodeURIComponent(fileParam);

  // Basic security check
  if (dirParam.includes('..') || fileParam.includes('..')) {
    return res.status(400).json({ error: "Invalid path." });
  }

  const fullPath = path.join(__dirname, dirParam, fileParam);
  fs.readFile(fullPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).send("File not found");
    }
    res.send(data);
  });
});

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  // Skip API routes and static assets
  if (req.path.startsWith('/api/') || 
      req.path.includes('.') || 
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/js/') ||
      req.path.startsWith('/css/') ||
      req.path.startsWith('/config/')) {
    return; // Let static middleware handle it
  }
  
  // Serve index.html for all other routes (client-side routing)
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, function () {
  console.log("Server listening on port " + PORT);
});
