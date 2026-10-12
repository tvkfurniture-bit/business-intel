import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from root directory
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: false // We will handle root index manually
}));

// Route root /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Friendly aliases for specific policy pages pointing to legal
const legalAliases = ['privacy', 'terms', 'refund-policy', 'disclaimer', 'research-policy'];
legalAliases.forEach(alias => {
  app.get([`/${alias}`, `/${alias}/`], (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'legal', 'index.html'));
  });
});

// Dynamic routing for pages directory
// Matches e.g. /opportunities, /opportunities/, /city/mumbai, /opportunity/specialty-coffee-roastery-mumbai
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  // Strip leading and trailing slashes and split path
  const cleanPath = req.path.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) return next();

  const segments = cleanPath.split('/');
  const topSection = segments[0];

  // 1. Direct page folder match: /<section> or /<section>/...
  const targetIndexPath = path.join(__dirname, 'pages', topSection, 'index.html');
  if (fs.existsSync(targetIndexPath)) {
    return res.sendFile(targetIndexPath);
  }

  // 2. Direct HTML file match in pages: /pages/<section>/index.html
  if (topSection === 'pages' && segments[1]) {
    const pageSubIndex = path.join(__dirname, 'pages', segments[1], 'index.html');
    if (fs.existsSync(pageSubIndex)) {
      return res.sendFile(pageSubIndex);
    }
  }

  next();
});

// 404 Handler
app.use((req, res) => {
  const notFoundPath = path.join(__dirname, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).send('Page not found');
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
