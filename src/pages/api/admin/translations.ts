import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getTokenFromCookieHeader } from '@/utils/token';
import type { JWTPayload } from '@/utils/auth';
import fs from 'fs';
import path from 'path';

interface TranslationData {
  [key: string]: {
    en: string;
    'zh-CN': string;
    'zh-TW': string;
  };
}

// Path to translations file
const TRANSLATIONS_FILE = path.join(process.cwd(), 'src', 'lib', 'translations.json');

// Load translations from file
function loadTranslationsFromFile(): TranslationData {
  try {
    if (fs.existsSync(TRANSLATIONS_FILE)) {
      const fileContent = fs.readFileSync(TRANSLATIONS_FILE, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading translations file:', error);
  }
  return {};
}

// Save translations to file
function saveTranslationsToFile(data: TranslationData): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(TRANSLATIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving translations file:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const token = getTokenFromCookieHeader(req.headers.cookie);
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    if (req.method === 'GET') {
      // Get all translations
      const translations = loadTranslationsFromFile();
      return res.status(200).json({ translations });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Update translations
      const { translations } = req.body;

      if (!translations || typeof translations !== 'object') {
        return res.status(400).json({ error: 'Invalid translations data' });
      }

      // Validate structure
      for (const [key, value] of Object.entries(translations)) {
        if (typeof value !== 'object' || value === null) {
          return res.status(400).json({ error: `Invalid translation for key: ${key}` });
        }
        
        const translation = value as { en?: string; 'zh-CN'?: string; 'zh-TW'?: string };
        if (!translation.en && !translation['zh-CN'] && !translation['zh-TW']) {
          return res.status(400).json({ error: `Translation for key ${key} must have at least one language` });
        }
      }

      // Save to file
      saveTranslationsToFile(translations);

      return res.status(200).json({ 
        success: true,
        message: 'Translations saved successfully',
        translations 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Translation API error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

