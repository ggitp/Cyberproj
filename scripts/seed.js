// scripts/seed.js
/* Seed demo products (with images) into MongoDB
 * - Uses config MONGODB_URI (node-config) or .env MONGO_URI, else defaults to localhost
 * - Always connects to the "ecommerce" database (unless your URI already includes a DB)
 * - Reads images from /public/images (png/jpg/jpeg) and stores them as Buffers
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Resolve base URI: node-config (MONGODB_URI) → .env (MONGO_URI) → default
const getBaseUri = () => {
  try {
    const config = require('config');
    if (config && config.has('MONGODB_URI')) return config.get('MONGODB_URI');
  } catch { /* no config module */ }
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  return 'mongodb://127.0.0.1:27017';
};

// Ensure we have a DB name at the end; default to "ecommerce"
const ensureDbName = (uri, dbName = 'ecommerce') => {
  // if uri already has a path part (e.g., /mydb), keep it
  // otherwise append /ecommerce
  const hasPath = /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(uri);
  return hasPath ? uri : `${uri.replace(/\/$/, '')}/${dbName}`;
};

(async () => {
  const baseUri = getBaseUri();
  const mongoUri = ensureDbName(baseUri, process.env.DB_NAME || 'ecommerce');

  try {
    console.log('[seed] Connecting to', mongoUri);
    await mongoose.connect(mongoUri);

    // Try to use existing Product model; else define a minimal one
    let Product;
    try {
      Product = require('../models/productModel'); // adjust if your model path differs
      console.log('[seed] Using existing Product model.');
    } catch {
      console.log('[seed] No existing Product model found, using fallback schema.');
      const productSchema = new mongoose.Schema({
        name: { type: String, required: true },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        bgcolor: { type: String, default: '#f3f3f3' },
        panelcolor: { type: String, default: '#e5e7eb' },
        textcolor: { type: String, default: '#111827' },
        image: { type: Buffer } // used in EJS: item.image.toString('base64')
      }, { collection: 'products', timestamps: true });

      Product = mongoose.models.Product || mongoose.model('Product', productSchema);
    }

    // Read images from /public/images (recursively, just in case)
    const imagesDir = path.join(__dirname, '..', 'public', 'images');
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries.flatMap(e => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? walk(full) : [full];
      });
    };
    const imgFiles = walk(imagesDir)
      .filter(p => /\.(png|jpe?g)$/i.test(p))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const readBuf = (p) => {
      try { return fs.readFileSync(p); } catch { return undefined; }
    };

    const palette = [
      { bg: '#f3f4f6', panel: '#e5e7eb', text: '#111827' },
      { bg: '#fff7ed', panel: '#fed7aa', text: '#7c2d12' },
      { bg: '#ecfeff', panel: '#a5f3fc', text: '#0e7490' },
      { bg: '#fef2f2', panel: '#fecaca', text: '#7f1d1d' },
      { bg: '#f0fdf4', panel: '#bbf7d0', text: '#14532d' },
      { bg: '#eef2ff', panel: '#c7d2fe', text: '#3730a3' },
      { bg: '#fffbeb', panel: '#fde68a', text: '#92400e' },
      { bg: '#f5f3ff', panel: '#ddd6fe', text: '#4c1d95' }
    ];

    const picks = (imgFiles.length ? imgFiles : Array(8).fill(undefined)).slice(0, 8);
    const docs = picks.map((imgPath, i) => {
      const colors = palette[i % palette.length];
      const base = imgPath ? path.basename(imgPath, path.extname(imgPath)) : `Bag ${i + 1}`;
      return {
        name: base.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim(),
        price: 80 + i * 15,
        discount: (i % 3 === 0) ? 10 : 0,
        bgcolor: colors.bg,
        panelcolor: colors.panel,
        textcolor: colors.text,
        image: imgPath ? readBuf(imgPath) : undefined
      };
    });

    const ops = docs.map(d => ({
      updateOne: {
        filter: { name: d.name },
        update: { $set: d },
        upsert: true
      }
    }));

    const result = await Product.bulkWrite(ops, { ordered: false });
    console.log('[seed] Upserted/modified products:', JSON.stringify(result.result || result, null, 2));
    console.log('[seed] Done.');
  } catch (err) {
    console.error('[seed] ERROR:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();