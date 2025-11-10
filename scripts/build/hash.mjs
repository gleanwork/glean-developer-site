#!/usr/bin/env node

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

export function hashFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function hashDirectory(dirPath, options = {}) {
  const { exclude = [], include = [] } = options;
  
  if (!fs.existsSync(dirPath)) {
    return null;
  }
  
  const files = [];
  
  function scanDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dirPath, fullPath);
      
      if (exclude.some(pattern => relativePath.includes(pattern))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        if (include.length === 0 || include.some(pattern => relativePath.endsWith(pattern))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({ path: relativePath, content });
        }
      }
    }
  }
  
  scanDir(dirPath);
  
  files.sort((a, b) => a.path.localeCompare(b.path));
  
  const combined = files.map(f => `${f.path}:${f.content}`).join('\n');
  return crypto.createHash('sha256').update(combined).digest('hex');
}

export function hashPackageVersion(packageName) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName];
  
  if (!version) {
    return null;
  }
  
  return crypto.createHash('sha256').update(`${packageName}@${version}`).digest('hex');
}

export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

