/**
 * API Route: Scan translation keys from source files
 * GET /api/admin/scan-translations
 * 
 * Note: This runs on the server side, so we can use Node.js fs module
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/utils/auth';
import { translations } from '@/lib/translations';
import fs from 'fs';
import path from 'path';

interface TranslationKeyInfo {
  key: string;
  file: string;
  line: number;
  page?: string;
  component?: string;
}

interface PageGroup {
  page: string;
  keys: TranslationKeyInfo[];
}

function extractPageName(filePath: string): string {
  let pagePath = filePath.replace(/^.*[\/\\]pages[\/\\]/, '');
  pagePath = pagePath.replace(/\.(tsx?|jsx?)$/, '');
  pagePath = pagePath.replace(/\[([^\]]+)\]/g, ':$1');
  
  if (pagePath.endsWith('/index') || pagePath === 'index') {
    pagePath = pagePath.replace(/\/?index$/, '') || '/';
  }
  
  if (!pagePath.startsWith('/')) {
    pagePath = '/' + pagePath;
  }
  
  pagePath = pagePath.replace(/\/+/g, '/');
  return pagePath || '/';
}

function extractComponentName(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  const dirname = path.dirname(filePath);
  const dirBasename = path.basename(dirname);
  
  if (filePath.includes('/components/')) {
    return dirBasename || basename;
  }
  
  return basename;
}

function scanFile(filePath: string): TranslationKeyInfo[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const keys: TranslationKeyInfo[] = [];
    const lines = content.split('\n');
    
    const patterns = [
      /t\(['"`]([^'"`]+)['"`]\)/g,
      /t\(['"`]([^'"`]+)['"`]\s*[,\)]/g,
    ];
    
    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const key = match[1].trim();
          if (key && !key.includes('${') && !key.includes('${')) {
            keys.push({
              key,
              file: filePath,
              line: index + 1,
              page: extractPageName(filePath),
              component: extractComponentName(filePath),
            });
          }
        }
      });
    });
    
    return keys;
  } catch (error) {
    console.warn(`Error scanning file ${filePath}:`, error);
    return [];
  }
}

function scanDirectory(dirPath: string, extensions: string[] = ['.tsx', '.ts', '.jsx', '.js']): string[] {
  const files: string[] = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      return files;
    }
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') {
        continue;
      }
      
      if (entry.isDirectory()) {
        files.push(...scanDirectory(fullPath, extensions));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Error scanning directory ${dirPath}:`, error);
  }
  
  return files;
}

function getAllPages(srcDir: string = path.join(process.cwd(), 'src')): string[] {
  const pagesDir = path.join(srcDir, 'pages');
  const allPages = new Set<string>();
  
  if (!fs.existsSync(pagesDir)) {
    return [];
  }
  
  // Helper function to recursively get all page files
  const getPageFiles = (dir: string): void => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip API routes, special files, and hidden files
        if (entry.name === 'api' || entry.name.startsWith('_') || entry.name.startsWith('.')) {
          continue;
        }
        
        if (entry.isDirectory()) {
          getPageFiles(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
            // Extract page route from file path
            // Normalize path separators for cross-platform compatibility
            const normalizedPath = fullPath.replace(/\\/g, '/');
            const pageRoute = extractPageName(normalizedPath);
            if (pageRoute && !pageRoute.includes('/api/')) {
              allPages.add(pageRoute);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dir}:`, error);
    }
  };
  
  getPageFiles(pagesDir);
  return Array.from(allPages).sort();
}

function scanAllTranslations(srcDir: string = path.join(process.cwd(), 'src')): {
  allKeys: TranslationKeyInfo[];
  byPage: PageGroup[];
  uniqueKeys: Set<string>;
  allPages: string[];
} {
  const allKeys: TranslationKeyInfo[] = [];
  const uniqueKeys = new Set<string>();
  
  const pagesDir = path.join(srcDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = scanDirectory(pagesDir);
    pageFiles.forEach(file => {
      // Skip API routes
      if (file.includes('/api/')) {
        return;
      }
      const keys = scanFile(file);
      keys.forEach(key => {
        allKeys.push(key);
        uniqueKeys.add(key.key);
      });
    });
  }
  
  const componentsDir = path.join(srcDir, 'components');
  if (fs.existsSync(componentsDir)) {
    const componentFiles = scanDirectory(componentsDir);
    componentFiles.forEach(file => {
      const keys = scanFile(file);
      keys.forEach(key => {
        allKeys.push(key);
        uniqueKeys.add(key.key);
      });
    });
  }
  
  const pageMap = new Map<string, TranslationKeyInfo[]>();
  allKeys.forEach(key => {
    const page = key.page || 'other';
    if (!pageMap.has(page)) {
      pageMap.set(page, []);
    }
    pageMap.get(page)!.push(key);
  });
  
  const byPage: PageGroup[] = Array.from(pageMap.entries())
    .map(([page, keys]) => ({
      page,
      keys: keys.sort((a, b) => a.key.localeCompare(b.key)),
    }))
    .sort((a, b) => a.page.localeCompare(b.page));
  
  // Get all pages from the routing structure
  const allPages = getAllPages(srcDir);
  
  return {
    allKeys,
    byPage,
    uniqueKeys,
    allPages,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isValid || authResult.user?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const scanResult = scanAllTranslations();
    
    // Get missing keys
    const missingKeys = scanResult.allKeys
      .filter(key => !translations[key.key])
      .map(key => key.key);
    const uniqueMissing = Array.from(new Set(missingKeys));

    res.status(200).json({
      success: true,
      data: {
        totalKeys: scanResult.allKeys.length,
        uniqueKeys: Array.from(scanResult.uniqueKeys),
        byPage: scanResult.byPage,
        missingKeys: uniqueMissing,
        allPages: scanResult.allPages,
      },
    });
  } catch (error) {
    console.error('Error scanning translations:', error);
    res.status(500).json({
      error: 'Failed to scan translations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

