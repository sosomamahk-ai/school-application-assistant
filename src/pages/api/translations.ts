import type { NextApiRequest, NextApiResponse } from 'next';
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

// Load translations from file (public endpoint, no auth required)
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const translations = loadTranslationsFromFile();
    return res.status(200).json({ translations });
  } catch (error) {
    console.error('Error loading translations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

