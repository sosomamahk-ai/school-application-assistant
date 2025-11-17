import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow all methods for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const apiKeyLength = process.env.OPENAI_API_KEY?.length || 0;
    
    return res.status(200).json({
      success: true,
      method: req.method,
      hasApiKey,
      apiKeyLength,
      headers: req.headers,
      message: 'Test endpoint is working!'
    });
  } catch (error) {
    return res.status(500).json({
      error: String(error),
      message: 'Test endpoint error'
    });
  }
}

