import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { logger } from '@docusaurus/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BuildCache {
  constructor(cacheDir = '.build-cache', options = {}) {
    this.cacheDir = path.isAbsolute(cacheDir)
      ? cacheDir
      : path.join(process.cwd(), cacheDir);
    this.manifestPath = path.join(this.cacheDir, 'manifest.json');
    this.disabled = process.env.DISABLE_BUILD_CACHE === 'true';
    this.verbose = options.verbose || 
                   process.env.VERBOSE === 'true' || 
                   process.argv.includes('--verbose');
    
    if (this.disabled) {
      logger.warn('Build cache is disabled via DISABLE_BUILD_CACHE=true');
    }
  }

  log(message, level = 'info') {
    // Skip verbose-only logs if not in verbose mode
    if (!this.verbose && level === 'verbose') {
      return;
    }
    
    // Use appropriate logger method based on level
    switch (level) {
      case 'error':
        logger.error(message);
        break;
      case 'warn':
        logger.warn(message);
        break;
      case 'success':
        logger.success(message);
        break;
      case 'verbose':
        // Verbose-only messages - show as regular info in verbose mode
        if (this.verbose) {
          // Use cyan for cache operations to make them stand out
          console.log(logger.cyan('[Cache]') + ' ' + message);
        }
        break;
      case 'info':
      default:
        // Only show info messages in verbose mode unless they're important
        if (this.verbose || message.includes('✓') || message.includes('✗')) {
          logger.info(message);
        }
        break;
    }
  }

  initialize() {
    if (this.disabled) {
      return;
    }

    this.log('Initializing build cache...', 'verbose');

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      this.log(`Created cache directory: ${this.cacheDir}`, 'verbose');
    }

    // Load or initialize manifest
    this.loadManifest();
  }

  loadManifest() {
    if (fs.existsSync(this.manifestPath)) {
      try {
        this.manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
        this.log('Loaded existing cache manifest', 'verbose');
      } catch (error) {
        this.log(`Failed to load manifest: ${error.message}`, 'warn');
        this.manifest = {};
      }
    } else {
      this.manifest = {};
      this.log('Initialized empty cache manifest', 'verbose');
    }
  }

  saveManifest() {
    if (this.disabled) {
      return;
    }

    try {
      fs.writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2));
      this.log('Cache manifest saved', 'verbose');
    } catch (error) {
      this.log(`Failed to save manifest: ${error.message}`, 'warn');
    }
  }

  calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getCachePath(category, subcategory) {
    return path.join(this.cacheDir, category, subcategory);
  }

  isValid(category, subcategory, expectedHash) {
    if (this.disabled) {
      return false;
    }

    const key = `${category}/${subcategory}`;
    const entry = this.manifest[key];

    if (entry && entry.hash === expectedHash) {
      const cachePath = this.getCachePath(category, subcategory);
      if (fs.existsSync(cachePath)) {
        this.log(`Cache hit for ${category}/${subcategory}`, 'verbose');
        return true;
      }
    }

    this.log(`Cache miss for ${category}/${subcategory}`, 'verbose');
    return false;
  }

  storeFile(category, subcategory, filePath, hash) {
    if (this.disabled) {
      return;
    }

    const cachePath = this.getCachePath(category, subcategory);
    
    // Create cache directory
    fs.mkdirSync(cachePath, { recursive: true });
    
    // Copy file to cache
    const cachedFilePath = path.join(cachePath, path.basename(filePath));
    fs.copyFileSync(filePath, cachedFilePath);
    
    // Update manifest
    const key = `${category}/${subcategory}`;
    this.manifest[key] = {
      hash,
      timestamp: Date.now(),
      type: 'file',
      file: path.basename(filePath)
    };
    
    this.saveManifest();
    this.log(`Saved file to cache: ${category}/${subcategory}/${path.basename(filePath)}`, 'verbose');
  }

  storeDirectory(category, subcategory, dirPath, hash, preserveFiles = []) {
    if (this.disabled) {
      return;
    }

    const cachePath = this.getCachePath(category, subcategory);
    
    // Create cache directory
    fs.mkdirSync(cachePath, { recursive: true });
    
    // Get all files in directory (excluding preserved files)
    const files = [];
    const scanDir = (dir, baseDir = '') => {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const relativePath = path.join(baseDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath, relativePath);
        } else if (!preserveFiles.some(p => fullPath.endsWith(p))) {
          files.push(relativePath);
          // Copy file to cache
          const cachedFilePath = path.join(cachePath, relativePath);
          fs.mkdirSync(path.dirname(cachedFilePath), { recursive: true });
          fs.copyFileSync(fullPath, cachedFilePath);
        }
      }
    };
    
    scanDir(dirPath);
    
    // Update manifest
    const key = `${category}/${subcategory}`;
    this.manifest[key] = {
      hash,
      timestamp: Date.now(),
      type: 'directory',
      files
    };
    
    this.saveManifest();
    this.log(`Saved directory to cache: ${category}/${subcategory}/ (${files.length} files)`, 'verbose');
  }

  restoreFile(category, subcategory, targetPath) {
    if (this.disabled) {
      return false;
    }

    const key = `${category}/${subcategory}`;
    const entry = this.manifest[key];
    
    if (!entry || entry.type !== 'file') {
      return false;
    }
    
    const cachePath = this.getCachePath(category, subcategory);
    const cachedFilePath = path.join(cachePath, entry.file);
    
    if (!fs.existsSync(cachedFilePath)) {
      return false;
    }
    
    // Create target directory if needed
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy from cache to target
    fs.copyFileSync(cachedFilePath, targetPath);
    this.log(`Restored file from cache: ${category}/${subcategory}/${path.basename(targetPath)}`, 'verbose');
    
    return true;
  }

  restoreDirectory(category, subcategory, targetPath) {
    if (this.disabled) {
      return false;
    }

    const key = `${category}/${subcategory}`;
    const entry = this.manifest[key];
    
    if (!entry || entry.type !== 'directory') {
      return false;
    }
    
    const cachePath = this.getCachePath(category, subcategory);
    
    if (!fs.existsSync(cachePath)) {
      return false;
    }
    
    // Create target directory if needed
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    // Copy all files from cache to target
    for (const file of entry.files) {
      const cachedFilePath = path.join(cachePath, file);
      const targetFilePath = path.join(targetPath, file);
      
      if (fs.existsSync(cachedFilePath)) {
        const targetFileDir = path.dirname(targetFilePath);
        if (!fs.existsSync(targetFileDir)) {
          fs.mkdirSync(targetFileDir, { recursive: true });
        }
        fs.copyFileSync(cachedFilePath, targetFilePath);
      }
    }
    
    this.log(`Restored directory from cache: ${category}/${subcategory}/ to ${targetPath}`, 'verbose');
    
    return true;
  }

  clear(category = null) {
    if (this.disabled) {
      return;
    }

    if (category) {
      // Clear specific category
      const categoryPath = path.join(this.cacheDir, category);
      if (fs.existsSync(categoryPath)) {
        fs.rmSync(categoryPath, { recursive: true, force: true });
      }
      
      // Remove category entries from manifest
      const keysToRemove = Object.keys(this.manifest).filter(key => key.startsWith(`${category}/`));
      keysToRemove.forEach(key => delete this.manifest[key]);
      
      this.saveManifest();
      logger.success(`Cleared ${category} cache`);
    } else {
      // Clear entire cache
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
      }
      this.manifest = {};
      this.initialize();
      logger.success('Cache cleared successfully');
    }
  }

  getStats() {
    const stats = {
      totalEntries: 0,
      totalSize: 0,
      categories: {}
    };

    if (this.disabled || !this.manifest) {
      return stats;
    }

    // Count entries and calculate sizes
    for (const [key, entry] of Object.entries(this.manifest)) {
      stats.totalEntries++;
      
      const [category] = key.split('/');
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      // Calculate size
      const cachePath = path.join(this.cacheDir, key);
      if (fs.existsSync(cachePath)) {
        const calculateDirSize = (dirPath) => {
          let size = 0;
          const entries = fs.readdirSync(dirPath);
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              size += calculateDirSize(fullPath);
            } else {
              size += stat.size;
            }
          }
          return size;
        };
        
        const stat = fs.statSync(cachePath);
        if (stat.isDirectory()) {
          stats.totalSize += calculateDirSize(cachePath);
        } else {
          stats.totalSize += stat.size;
        }
      }
    }

    return stats;
  }

  printStats() {
    const stats = this.getStats();
    
    logger.newLine();
    logger.info('Cache Statistics:');
    logger.info(`  Total entries: ${logger.num(stats.totalEntries)}`);
    logger.info(`  Total size: ${logger.num((stats.totalSize / 1024 / 1024).toFixed(2))} MB`);
    
    if (stats.categories && Object.keys(stats.categories).length > 0) {
      logger.info('  Categories:');
      Object.entries(stats.categories).forEach(([category, count]) => {
        logger.info(`    ${category}: ${logger.num(count)} entries`);
      });
    }
  }

  invalidate(category, subcategory) {
    const key = `${category}/${subcategory}`;
    if (this.manifest[key]) {
      delete this.manifest[key];
      
      // Remove cached files
      const cachePath = this.getCachePath(category, subcategory);
      if (fs.existsSync(cachePath)) {
        fs.rmSync(cachePath, { recursive: true, force: true });
      }
      
      this.saveManifest();
    }
  }

  getCacheKey(category, subcategory) {
    const key = `${category}/${subcategory}`;
    return this.manifest[key];
  }

  getAllKeys() {
    return Object.keys(this.manifest || {});
  }

  getCategoryKeys(category) {
    return this.getAllKeys().filter(key => key.startsWith(`${category}/`));
  }

  getAge(category, subcategory) {
    const key = `${category}/${subcategory}`;
    const entry = this.manifest[key];
    if (entry && entry.timestamp) {
      return Date.now() - entry.timestamp;
    }
    return Infinity;
  }

  isStale(category, subcategory, maxAge) {
    return this.getAge(category, subcategory) > maxAge;
  }

  updateTimestamp(category, subcategory) {
    const key = `${category}/${subcategory}`;
    if (this.manifest[key]) {
      this.manifest[key].timestamp = Date.now();
      this.saveManifest();
    }
  }

  exists(category, subcategory) {
    const key = `${category}/${subcategory}`;
    if (!this.manifest[key]) {
      return false;
    }
    
    const cachePath = this.getCachePath(category, subcategory);
    return fs.existsSync(cachePath);
  }

  getMetadata(category, subcategory) {
    const key = `${category}/${subcategory}`;
    return this.manifest[key] || null;
  }

  setMetadata(category, subcategory, metadata) {
    const key = `${category}/${subcategory}`;
    if (this.manifest[key]) {
      this.manifest[key] = { ...this.manifest[key], ...metadata };
      this.saveManifest();
    }
  }
}