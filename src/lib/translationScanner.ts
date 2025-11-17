/**
 * Translation Key Scanner
 * Scans all source files to extract translation keys used in the codebase
 */

import fs from 'fs';
import path from 'path';

export interface TranslationKeyInfo {
  key: string;
  file: string;
  line: number;
  page?: string;
  component?: string;
}

export interface PageGroup {
  page: string;
  keys: TranslationKeyInfo[];
}

/**
 * Extract page name from file path
 */
function extractPageName(filePath: string): string {
  // Remove src/pages prefix
  let pagePath = filePath.replace(/^.*src[\/\\]pages[\/\\]/, '');
  
  // Remove file extension
  pagePath = pagePath.replace(/\.(tsx?|jsx?)$/, '');
  
  // Handle dynamic routes [id] -> :id
  pagePath = pagePath.replace(/\[([^\]]+)\]/g, ':$1');
  
  // Handle index files
  if (pagePath.endsWith('/index') || pagePath === 'index') {
    pagePath = pagePath.replace(/\/?index$/, '') || '/';
  }
  
  // Convert to route format
  if (!pagePath.startsWith('/')) {
    pagePath = '/' + pagePath;
  }
  
  // Clean up
  pagePath = pagePath.replace(/\/+/g, '/');
  
  return pagePath || '/';
}

/**
 * Extract component name from file path
 */
function extractComponentName(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  const dirname = path.dirname(filePath);
  const dirBasename = path.basename(dirname);
  
  // If it's a component file, use the directory name
  if (filePath.includes('/components/')) {
    return dirBasename || basename;
  }
  
  return basename;
}

/**
 * Scan a single file for translation keys
 */
function scanFile(filePath: string): TranslationKeyInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys: TranslationKeyInfo[] = [];
  const lines = content.split('\n');
  
  // Patterns to match t('key'), t("key"), t(`key`), t('key.subkey'), etc.
  const patterns = [
    /t\(['"`]([^'"`]+)['"`]\)/g,  // t('key')
    /t\(['"`]([^'"`]+)['"`]\s*[,\)]/g,  // t('key', ...)
  ];
  
  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const key = match[1].trim();
        // Skip empty keys and template literals with expressions
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
}

/**
 * Recursively scan directory for source files
 */
function scanDirectory(dirPath: string, extensions: string[] = ['.tsx', '.ts', '.jsx', '.js']): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip node_modules, .next, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
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

/**
 * Scan all source files and extract translation keys
 */
export function scanAllTranslations(srcDir: string = path.join(process.cwd(), 'src')): {
  allKeys: TranslationKeyInfo[];
  byPage: PageGroup[];
  uniqueKeys: Set<string>;
} {
  const allKeys: TranslationKeyInfo[] = [];
  const uniqueKeys = new Set<string>();
  
  // Scan pages directory
  const pagesDir = path.join(srcDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = scanDirectory(pagesDir);
    pageFiles.forEach(file => {
      const keys = scanFile(file);
      keys.forEach(key => {
        allKeys.push(key);
        uniqueKeys.add(key.key);
      });
    });
  }
  
  // Scan components directory
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
  
  // Group by page
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
  
  return {
    allKeys,
    byPage,
    uniqueKeys,
  };
}

/**
 * Get missing translation keys (keys used in code but not in translations file)
 */
export function getMissingKeys(
  scannedKeys: Set<string>,
  existingTranslations: Record<string, any>
): string[] {
  const missing: string[] = [];
  scannedKeys.forEach(key => {
    if (!existingTranslations[key]) {
      missing.push(key);
    }
  });
  return missing.sort();
}

